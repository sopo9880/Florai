import { getRoleLabel } from "@/services/authRepository";
import type { AuthUser } from "@/types/auth";

type HeaderProps = {
  user: AuthUser | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
  onMyPage: () => void;
  onToggleSidebar: () => void;
};

export function Header({
  user,
  onLogin,
  onSignup,
  onLogout,
  onMyPage,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(221,232,223,0.8)] bg-[rgba(255,253,248,0.86)] backdrop-blur">
      <div className="florai-shell flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {user?.role === "seller" && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-lg font-black text-[var(--green-strong)] transition hover:border-[var(--green)]"
              aria-label="판매자 메뉴 열기"
            >
              ☰
            </button>
          )}
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--green)] text-lg font-black text-[var(--green-strong)]">
            F
          </div>
          <button type="button" onClick={onMyPage} className="min-w-0 text-left">
            <p className="text-lg font-black leading-none">Florai</p>
            <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">
              AI 화훼 품질 관리
            </p>
          </button>
        </div>

        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onMyPage}
              className="hidden rounded-full bg-[var(--green)] px-3 py-2 text-xs font-black text-[var(--green-strong)] sm:inline-flex"
            >
              {user.name} · {getRoleLabel(user.role)}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--pink)] hover:text-[#9d4949]"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onLogin}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--green-strong)] transition hover:border-[var(--green)]"
            >
              로그인
            </button>
            <button
              type="button"
              onClick={onSignup}
              className="rounded-full bg-[var(--green-strong)] px-3 py-2 text-xs font-black text-white transition hover:bg-[#2b6847]"
            >
              회원가입
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
