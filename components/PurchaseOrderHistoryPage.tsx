"use client";

import { useEffect, useState } from "react";
import { productListingRepository } from "@/services/productListingRepository";
import { purchaseOrderRepository } from "@/services/purchaseOrderRepository";
import type { AuthUser } from "@/types/auth";
import type { ProductListingImage } from "@/types/productListing";
import type { PurchaseOrder } from "@/types/purchaseOrder";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "구매 내역",
  title: "구매 요청 내역",
  description:
    "내 계정으로 요청한 구매 내역을 확인할 수 있습니다.",
  emptyTitle: "아직 구매 요청이 없습니다",
  emptyBody: "상품 목록에서 구매하기를 눌러 구매 요청을 만들어 보세요.",
  clear: "구매 내역 비우기",
  marketplace: "상품 목록 보기",
  newAnalysis: "새 분석 시작하기",
};

type PurchaseOrderHistoryPageProps = {
  user: AuthUser | null;
  canAnalyze: boolean;
  onViewMarketplace: () => void;
  onNewAnalysis: () => void;
};

export function PurchaseOrderHistoryPage({
  user,
  canAnalyze,
  onViewMarketplace,
  onNewAnalysis,
}: PurchaseOrderHistoryPageProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const allOrders = purchaseOrderRepository.list();
      setOrders(user ? allOrders.filter((order) => order.buyer.buyerId === user.userId) : []);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [user]);

  const reload = () => {
    const allOrders = purchaseOrderRepository.list();
    setOrders(user ? allOrders.filter((order) => order.buyer.buyerId === user.userId) : []);
  };

  const clearOrders = () => {
    purchaseOrderRepository.clear();
    reload();
  };

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[var(--green-strong)]">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-black">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--muted)]">
            {t.description}
          </p>
        </div>
        {orders.length > 0 && (
          <button
            type="button"
            onClick={clearOrders}
            className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-black text-[var(--muted)] transition hover:border-[var(--pink)] hover:text-[#9d4949]"
          >
            {t.clear}
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <article className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-black">{t.emptyTitle}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--muted)]">
            {t.emptyBody}
          </p>
        </article>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <PurchaseOrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-2">
        <SecondaryButton onClick={onViewMarketplace}>{t.marketplace}</SecondaryButton>
        {canAnalyze ? (
          <PrimaryButton onClick={onNewAnalysis}>{t.newAnalysis}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={onViewMarketplace}>{t.marketplace}</PrimaryButton>
        )}
      </div>
    </section>
  );
}

function PurchaseOrderCard({ order }: { order: PurchaseOrder }) {
  const image = getOrderDisplayImage(order);

  return (
    <article className="overflow-hidden rounded-xl border border-white bg-white shadow-[var(--shadow)]">
      {image ? (
        <img
          src={image.dataUrl}
          alt={`${order.product.title} 주문 이미지`}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,var(--green),var(--pink-soft))] p-6 text-center">
          <div>
            <p className="text-xs font-black text-[var(--green-strong)]">Florai 주문 상품</p>
            <p className="mt-2 text-lg font-black text-[var(--ink)]">{order.product.title}</p>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--green)] px-3 py-1 text-xs font-black text-[var(--green-strong)]">
            구매 요청
          </span>
          <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-black text-[var(--muted)]">
            {order.payment.method}
          </span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-black">{order.product.title}</h2>
        <p className="mt-2 text-xl font-black text-[var(--green-strong)]">
          {order.item.totalPrice.toLocaleString()}원
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <CardMeta label="수량" value={`${order.item.quantity}${order.item.unit}`} />
          <CardMeta label="구매자" value={order.buyer.buyerName} />
          <CardMeta label="희망 수령일" value={order.fulfillment.desiredDate || "-"} />
          <CardMeta label="주문번호" value={order.orderId} />
        </dl>
      </div>
    </article>
  );
}

function CardMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-black text-[var(--ink)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--muted)]">{value}</dd>
    </div>
  );
}


function getOrderDisplayImage(order: PurchaseOrder): ProductListingImage | null {
  const listing = productListingRepository.get(order.listingId);
  if (listing?.image) return listing.image;

  const legacyImage = (order as unknown as { image?: ProductListingImage }).image;
  return legacyImage ?? null;
}
