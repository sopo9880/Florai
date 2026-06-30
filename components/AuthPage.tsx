"use client";

import { useState } from "react";
import { authRepository, getRoleLabel } from "@/services/authRepository";
import type { AuthUser, AuthUserRole } from "@/types/auth";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

type AuthMode = "login" | "signup";

type AuthPageProps = {
  mode: AuthMode;
  defaultRole?: AuthUserRole;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (user: AuthUser) => void;
  onBack: () => void;
};

export function AuthPage({
  mode,
  defaultRole = "buyer",
  onModeChange,
  onAuthenticated,
  onBack,
}: AuthPageProps) {
  const [role, setRole] = useState<AuthUserRole>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isSignup = mode === "signup";

  const submit = () => {
    setErrorMessage("");

    try {
      if (!email.trim()) throw new Error("이메일을 입력해 주세요.");
      if (!password.trim()) throw new Error("비밀번호를 입력해 주세요.");

      if (isSignup) {
        if (!name.trim()) throw new Error("이름 또는 상호명을 입력해 주세요.");
        const user = authRepository.signup({ role, name, email, phone, password });
        onAuthenticated(user);
        return;
      }

      const user = authRepository.login({ email, password });
      onAuthenticated(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-8">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-white bg-white p-6 shadow-[var(--shadow)]">
          <p className="text-sm font-extrabold text-[var(--green-strong)]">
            Florai Account
          </p>
          <h1 className="mt-3 text-3xl font-black">
            {isSignup ? "회원가입" : "로그인"}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">
            구매자는 상품 구매 중심으로, 판매자는 AI 품질 분석과 상품 게시까지 사용할 수 있습니다.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-[var(--surface)] p-1">
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={`rounded-full px-4 py-3 text-sm font-black transition ${!isSignup ? "bg-white text-[var(--green-strong)] shadow-sm" : "text-[var(--muted)]"}`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className={`rounded-full px-4 py-3 text-sm font-black transition ${isSignup ? "bg-white text-[var(--green-strong)] shadow-sm" : "text-[var(--muted)]"}`}
            >
              회원가입
            </button>
          </div>
        </article>

        <article className="rounded-xl border border-[var(--line)] bg-white p-6 shadow-sm">
          {isSignup && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-black">가입 유형</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <RoleButton
                  role="buyer"
                  selected={role === "buyer"}
                  title="구매자용"
                  body="상품 목록 확인과 구매 요청을 사용할 수 있습니다."
                  onClick={() => setRole("buyer")}
                />
                <RoleButton
                  role="seller"
                  selected={role === "seller"}
                  title="판매자용"
                  body="AI 분석, 상품 게시, 구매 요청을 모두 사용할 수 있습니다."
                  onClick={() => setRole("seller")}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {isSignup && (
              <Field label={role === "seller" ? "상호명 또는 이름" : "이름"}>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={role === "seller" ? "예: 광주 플라워팜" : "예: 홍길동"}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>
            )}

            <Field label="이메일">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="florai@example.com"
                className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
              />
            </Field>

            {isSignup && (
              <Field label="연락처">
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>
            )}

            <Field label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
              />
            </Field>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-lg bg-[var(--pink-soft)] px-4 py-3 text-sm font-bold text-[#9d4949]">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SecondaryButton onClick={onBack}>돌아가기</SecondaryButton>
            <PrimaryButton onClick={submit}>
              {isSignup ? `${getRoleLabel(role)} 회원가입` : "로그인"}
            </PrimaryButton>
          </div>
        </article>
      </div>
    </section>
  );
}

function RoleButton({
  role,
  selected,
  title,
  body,
  onClick,
}: {
  role: AuthUserRole;
  selected: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${
        selected
          ? "border-[var(--green-strong)] bg-[#f2fbf5]"
          : "border-[var(--line)] bg-white hover:border-[var(--green)]"
      }`}
    >
      <p className="text-sm font-black text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[var(--muted)]">{body}</p>
      <p className="mt-3 text-xs font-black text-[var(--green-strong)]">
        {getRoleLabel(role)} 계정
      </p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      {children}
    </label>
  );
}
