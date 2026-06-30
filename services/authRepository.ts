import type { AuthUser, LoginInput, SignupInput, StoredAuthUser } from "@/types/auth";

const USERS_KEY = "florai:local:users:v1";
const SESSION_KEY = "florai:local:session:v1";

export const authRepository = {
  signup(input: SignupInput): AuthUser {
    const users = readUsers();
    const email = normalizeEmail(input.email);

    if (users.some((user) => normalizeEmail(user.email) === email)) {
      throw new Error("이미 가입된 이메일입니다.");
    }

    const now = new Date().toISOString();
    const user: StoredAuthUser = {
      schemaVersion: "florai.user.v1",
      userId: createUserId(input.role),
      role: input.role,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      password: input.password,
      createdAt: now,
    };

    writeUsers([user, ...users]);
    writeSession(user);
    return stripPassword(user);
  },

  login(input: LoginInput): AuthUser {
    const email = normalizeEmail(input.email);
    const user = readUsers().find(
      (candidate) => normalizeEmail(candidate.email) === email && candidate.password === input.password,
    );

    if (!user) {
      throw new Error("이메일 또는 비밀번호를 확인해 주세요.");
    }

    writeSession(user);
    return stripPassword(user);
  },

  logout() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const sessionId = window.localStorage.getItem(SESSION_KEY);
    if (!sessionId) return null;
    const user = readUsers().find((candidate) => candidate.userId === sessionId);
    return user ? stripPassword(user) : null;
  },

  listUsers(): AuthUser[] {
    return readUsers().map(stripPassword);
  },
};

export function getRoleLabel(role: AuthUser["role"]) {
  return role === "seller" ? "판매자" : "구매자";
}

function readUsers(): StoredAuthUser[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredAuthUser);
  } catch {
    return [];
  }
}

function writeUsers(users: StoredAuthUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function writeSession(user: StoredAuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, user.userId);
}

function stripPassword(user: StoredAuthUser): AuthUser {
  return {
    schemaVersion: "florai.user.v1",
    userId: user.userId,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

function isStoredAuthUser(value: unknown): value is StoredAuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredAuthUser>;
  return (
    candidate.schemaVersion === "florai.user.v1" &&
    typeof candidate.userId === "string" &&
    (candidate.role === "buyer" || candidate.role === "seller") &&
    typeof candidate.email === "string" &&
    typeof candidate.password === "string"
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createUserId(role: AuthUser["role"]) {
  const random = Math.random().toString(16).slice(2, 10);
  return `${role}_${Date.now()}_${random}`;
}
