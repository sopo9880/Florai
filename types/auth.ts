export type AuthUserRole = "buyer" | "seller";

export type AuthUser = {
  schemaVersion: "florai.user.v1";
  userId: string;
  role: AuthUserRole;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

export type SignupInput = {
  role: AuthUserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type StoredAuthUser = AuthUser & {
  password: string;
};
