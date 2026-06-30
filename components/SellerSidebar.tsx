"use client";

import { getRoleLabel } from "@/services/authRepository";
import type { AuthUser } from "@/types/auth";

type SellerSidebarProps = {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
  onHome: () => void;
  onAnalyze: () => void;
  onMarketplace: () => void;
  onOrders: () => void;
  onMyPage: () => void;
  onLogout: () => void;
};

export function SellerSidebar({
  user,
  open,
  onClose,
  onHome,
  onAnalyze,
  onMarketplace,
  onOrders,
  onMyPage,
  onLogout,
}: SellerSidebarProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="사이드바 닫기"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] lg:hidden"
      />
      <aside className="fixed left-0 top-0 z-40 flex h-svh w-[min(86vw,320px)] flex-col border-r border-[var(--line)] bg-white shadow-[var(--shadow)]">
        <div className="border-b border-[var(--line)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-black">Florai</p>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                {user.name} · {getRoleLabel(user.role)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-lg font-black text-[var(--muted)]"
            >
              ×
            </button>
          </div>
        </div>

        <nav className="grid gap-2 p-4">
          <SidebarButton onClick={onHome}>홈</SidebarButton>
          <SidebarButton onClick={onAnalyze}>AI 품질 분석</SidebarButton>
          <SidebarButton onClick={onMarketplace}>상품 목록</SidebarButton>
          <SidebarButton onClick={onOrders}>구매 내역</SidebarButton>
          <SidebarButton onClick={onMyPage}>마이페이지</SidebarButton>
        </nav>

        <div className="mt-auto border-t border-[var(--line)] p-4">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-black text-[var(--muted)] transition hover:border-[var(--pink)] hover:text-[#9d4949]"
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-4 py-3 text-left text-sm font-black text-[var(--ink)] transition hover:bg-[var(--surface)] hover:text-[var(--green-strong)]"
    >
      {children}
    </button>
  );
}
