"use client";

import { productListingRepository } from "@/services/productListingRepository";
import type { ProductListingImage } from "@/types/productListing";
import type { PurchaseOrder } from "@/types/purchaseOrder";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "구매 요청 완료",
  title: "구매 요청이 생성되었습니다",
  description:
    "구매 요청이 접수되었습니다. 판매자 확인 후 수령 방식과 결제 방식이 확정됩니다.",
  marketplace: "상품 목록 보기",
  orders: "구매 내역 보기",
};

type ProductPurchaseCompletePageProps = {
  order: PurchaseOrder;
  onViewMarketplace: () => void;
  onViewOrders: () => void;
};

export function ProductPurchaseCompletePage({
  order,
  onViewMarketplace,
  onViewOrders,
}: ProductPurchaseCompletePageProps) {
  const image = getOrderDisplayImage(order);

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black">{t.title}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">
          {t.description}
        </p>

        <article className="mt-6 overflow-hidden rounded-xl border border-white bg-white shadow-[var(--shadow)]">
          {image ? (
            <img
              src={image.dataUrl}
              alt={`${order.product.title} 구매 상품 이미지`}
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-[linear-gradient(135deg,var(--green),var(--pink-soft))] p-8 text-center">
              <div>
                <p className="text-sm font-black text-[var(--green-strong)]">Florai 주문 상품</p>
                <p className="mt-2 text-2xl font-black text-[var(--ink)]">{order.product.title}</p>
              </div>
            </div>
          )}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--green)] px-3 py-1 text-xs font-black text-[var(--green-strong)]">
                주문 요청
              </span>
              <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                {order.payment.method}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black">{order.product.title}</h2>
            <p className="mt-2 text-lg font-black text-[var(--green-strong)]">
              {order.item.totalPrice.toLocaleString()}원
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
              {order.item.quantity}{order.item.unit} · {order.fulfillment.deliveryMethod} · {order.fulfillment.desiredDate || "희망일 미입력"}
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <MetaRow label="구매자" value={order.buyer.buyerName} />
              <MetaRow label="연락처" value={order.buyer.buyerPhone} />
              <MetaRow label="판매자" value={order.seller.sellerName} />
              <MetaRow label="주문번호" value={order.orderId} />
            </dl>
          </div>
        </article>

        <div className="safe-bottom mt-6 grid gap-3 sm:grid-cols-2">
          <SecondaryButton onClick={onViewMarketplace}>{t.marketplace}</SecondaryButton>
          <PrimaryButton onClick={onViewOrders}>{t.orders}</PrimaryButton>
        </div>
      </div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-[var(--surface)] px-4 py-3">
      <dt className="font-black text-[var(--ink)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--muted)]">{value || "-"}</dd>
    </div>
  );
}


function getOrderDisplayImage(order: PurchaseOrder): ProductListingImage | null {
  const listing = productListingRepository.get(order.listingId);
  if (listing?.image) return listing.image;

  const legacyImage = (order as unknown as { image?: ProductListingImage }).image;
  return legacyImage ?? null;
}
