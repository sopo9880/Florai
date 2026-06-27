"use client";

import { useEffect, useState } from "react";
import { productListingRepository } from "@/services/productListingRepository";
import type { ProductListing } from "@/types/productListing";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "상품 목록",
  title: "데모 판매 상품 목록",
  description:
    "현재 상품 목록은 localStorage 기반 데모 저장소입니다. 같은 브라우저에서는 새로고침해도 유지되고, 추후 DB API로 저장소만 교체할 수 있습니다.",
  emptyTitle: "아직 게시된 상품이 없습니다",
  emptyBody: "AI 품질 평가를 완료한 뒤 상품 게시하기를 눌러 첫 상품 카드를 만들어 보세요.",
  newAnalysis: "새 분석 시작하기",
  back: "처음으로",
  clear: "데모 목록 비우기",
};

type ProductMarketplacePageProps = {
  onBack: () => void;
  onNewAnalysis: () => void;
};

export function ProductMarketplacePage({
  onBack,
  onNewAnalysis,
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
            <ProductListingCard key={listing.listingId} listing={listing} />
          ))}
        </div>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-2">
        <SecondaryButton onClick={onBack}>{t.back}</SecondaryButton>
        <PrimaryButton onClick={onNewAnalysis}>{t.newAnalysis}</PrimaryButton>
      </div>
    </section>
  );
}

function ProductListingCard({ listing }: { listing: ProductListing }) {
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
