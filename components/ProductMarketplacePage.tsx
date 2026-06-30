"use client";

import { useEffect, useState } from "react";
import { productListingRepository } from "@/services/productListingRepository";
import type { AuthUser } from "@/types/auth";
import type { ProductListing } from "@/types/productListing";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "상품 목록",
  title: "판매 상품 목록",
  description:
    "AI 품질 분석을 거쳐 게시된 화훼 상품을 확인하고 구매 요청을 진행할 수 있습니다.",
  emptyTitle: "아직 게시된 상품이 없습니다",
  emptyBody: "판매자가 상품을 게시하면 이곳에서 확인할 수 있습니다.",
  newAnalysis: "AI 분석 시작하기",
  back: "처음으로",
  clear: "상품 목록 비우기",
  orders: "구매 내역",
  buy: "구매하기",
  soldOut: "품절",
  ownListing: "내 상품",
};

type ProductMarketplacePageProps = {
  canAnalyze: boolean;
  canPurchase: boolean;
  currentUser: AuthUser | null;
  onBack: () => void;
  onNewAnalysis: () => void;
  onPurchase: (listing: ProductListing) => void;
  onViewOrders: () => void;
  onLoginRequired: () => void;
};

export function ProductMarketplacePage({
  canAnalyze,
  canPurchase,
  currentUser,
  onBack,
  onNewAnalysis,
  onPurchase,
  onViewOrders,
  onLoginRequired,
}: ProductMarketplacePageProps) {
  const [listings, setListings] = useState<ProductListing[]>([]);

  const reload = () => setListings(productListingRepository.list());

  useEffect(() => {
    const frame = window.requestAnimationFrame(reload);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const clearListings = () => {
    productListingRepository.clear();
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onViewOrders}
            className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-black text-[var(--green-strong)] transition hover:border-[var(--green)] hover:bg-[#f7fbf5]"
          >
            {t.orders}
          </button>
          {listings.length > 0 && (
            <button
              type="button"
              onClick={clearListings}
              className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-black text-[var(--muted)] transition hover:border-[var(--pink)] hover:text-[#9d4949]"
            >
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {listings.length === 0 ? (
        <article className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-black">{t.emptyTitle}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--muted)]">
            {t.emptyBody}
          </p>
        </article>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ProductListingCard
              key={listing.listingId}
              listing={listing}
              isOwnListing={currentUser?.userId === listing.seller.sellerId}
              onPurchase={() => {
                if (currentUser?.userId === listing.seller.sellerId) {
                  return;
                }
                if (!canPurchase) {
                  onLoginRequired();
                  return;
                }
                onPurchase(listing);
              }}
            />
          ))}
        </div>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-2">
        <SecondaryButton onClick={onBack}>{t.back}</SecondaryButton>
        {canAnalyze ? (
          <PrimaryButton onClick={onNewAnalysis}>{t.newAnalysis}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={onViewOrders}>{t.orders}</PrimaryButton>
        )}
      </div>
    </section>
  );
}

function ProductListingCard({
  listing,
  isOwnListing,
  onPurchase,
}: {
  listing: ProductListing;
  isOwnListing: boolean;
  onPurchase: () => void;
}) {
  const isSoldOut = listing.sale.quantity <= 0 || listing.status === "hidden";
  const purchaseDisabled = isSoldOut || isOwnListing;

  return (
    <article className="overflow-hidden rounded-xl border border-white bg-white shadow-[var(--shadow)]">
      <img
        src={listing.image.dataUrl}
        alt={`${listing.product.title} 상품 이미지`}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--green)] px-3 py-1 text-xs font-black text-[var(--green-strong)]">
            AI {listing.quality.grade}
          </span>
          <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-black text-[var(--muted)]">
            {listing.product.categoryLabel}
          </span>
          {isSoldOut && (
            <span className="rounded-full bg-[var(--pink-soft)] px-3 py-1 text-xs font-black text-[#9d4949]">
              {t.soldOut}
            </span>
          )}
          {isOwnListing && !isSoldOut && (
            <span className="rounded-full bg-[var(--pink-soft)] px-3 py-1 text-xs font-black text-[#9d4949]">
              {t.ownListing}
            </span>
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-black">{listing.product.title}</h2>
        <p className="mt-2 text-xl font-black text-[var(--green-strong)]">
          {listing.sale.price.toLocaleString()}원
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <CardMeta label="수량" value={`${listing.sale.quantity}${listing.sale.unit}`} />
          <CardMeta label="지역" value={listing.sale.location || "-"} />
          <CardMeta label="출하 가능일" value={listing.sale.availableFrom || "-"} />
        </dl>
        <p className="mt-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--muted)]">
          {listing.quality.summary}
        </p>
        <button
          type="button"
          onClick={onPurchase}
          disabled={purchaseDisabled}
          className="mt-4 min-h-12 w-full rounded-full bg-[var(--green-strong)] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-[#2b6847] disabled:cursor-not-allowed disabled:bg-[#b9c9bf]"
        >
          {isSoldOut ? t.soldOut : isOwnListing ? t.ownListing : t.buy}
        </button>
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
