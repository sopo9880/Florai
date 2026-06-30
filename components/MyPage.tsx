"use client";

import { useEffect, useState } from "react";
import { getRoleLabel } from "@/services/authRepository";
import { productListingRepository } from "@/services/productListingRepository";
import { purchaseOrderRepository } from "@/services/purchaseOrderRepository";
import type { AuthUser } from "@/types/auth";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

type MyPageProps = {
  user: AuthUser;
  onBack: () => void;
  onAnalyze: () => void;
  onMarketplace: () => void;
  onOrders: () => void;
  onLogout: () => void;
};

export function MyPage({
  user,
  onBack,
  onAnalyze,
  onMarketplace,
  onOrders,
  onLogout,
}: MyPageProps) {
  const [listingCount, setListingCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setListingCount(
        productListingRepository
          .list()
          .filter((listing) => listing.seller.sellerId === user.userId).length,
      );
      setOrderCount(
        purchaseOrderRepository
          .list()
          .filter((order) => order.buyer.buyerId === user.userId).length,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [user.userId]);

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">마이페이지</p>
        <h1 className="mt-2 text-3xl font-black">{user.name}</h1>
        <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
          {getRoleLabel(user.role)} 계정 · {user.email}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard label="계정 유형" value={getRoleLabel(user.role)} />
          <MetricCard label="게시 상품" value={`${listingCount}개`} />
          <MetricCard label="구매 요청" value={`${orderCount}건`} />
        </div>

        <article className="mt-6 rounded-xl border border-[var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">사용 가능 기능</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {user.role === "seller" && (
              <ActionCard
                title="AI 품질 분석"
                body="사진과 입력정보를 기반으로 등급 판별을 요청하고 상품 게시까지 이어갑니다."
                onClick={onAnalyze}
              />
            )}
            <ActionCard
              title="상품 목록"
              body="등록된 화훼 상품을 확인하고 구매 요청을 진행합니다."
              onClick={onMarketplace}
            />
            <ActionCard
              title="구매 내역"
              body="내 계정으로 요청한 구매 내역을 확인합니다."
              onClick={onOrders}
            />
          </div>
        </article>

        <div className="safe-bottom mt-6 grid gap-3 sm:grid-cols-3">
          <SecondaryButton onClick={onBack}>돌아가기</SecondaryButton>
          <SecondaryButton onClick={onLogout}>로그아웃</SecondaryButton>
          <PrimaryButton onClick={onMarketplace}>상품 목록 보기</PrimaryButton>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white bg-white p-5 shadow-[var(--shadow)]">
      <p className="text-xs font-black text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--green-strong)]">{value}</p>
    </article>
  );
}

function ActionCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[var(--line)] bg-white p-4 text-left transition hover:border-[var(--green)] hover:bg-[#f7fbf5]"
    >
      <p className="text-base font-black">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">{body}</p>
    </button>
  );
}
