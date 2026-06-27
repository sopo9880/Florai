"use client";

import type { ProductListing } from "@/types/productListing";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "게시 완료",
  title: "상품 카드가 생성되었습니다",
  description:
    "현재 데모에서는 상품 정보가 이 브라우저의 localStorage에 저장됩니다. 나중에는 동일한 listing JSON을 DB 저장 API로 보내면 됩니다.",
  newAnalysis: "새 상품 분석하기",
  marketplace: "상품 목록 보기",
};

type ProductPublishCompletePageProps = {
  listing: ProductListing;
  onNewAnalysis: () => void;
  onViewMarketplace: () => void;
};

export function ProductPublishCompletePage({
  listing,
  onNewAnalysis,
  onViewMarketplace,
}: ProductPublishCompletePageProps) {
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
          <img
            src={listing.image.dataUrl}
            alt={`${listing.product.title} 상품 이미지`}
            className="aspect-[16/10] w-full object-cover"
          />
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--green)] px-3 py-1 text-xs font-black text-[var(--green-strong)]">
                AI {listing.quality.grade}
              </span>
              <span className="rounded-full bg-[var(--pink-soft)] px-3 py-1 text-xs font-black text-[#9d4949]">
                {listing.quality.condition === "normal" ? "정상" : "확인 필요"}
              </span>
              <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                {listing.product.categoryLabel}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black">{listing.product.title}</h2>
            <p className="mt-2 text-lg font-black text-[var(--green-strong)]">
              {listing.sale.price.toLocaleString()}원
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
              {listing.sale.quantity}{listing.sale.unit} · {listing.sale.location || "지역 미입력"} · {listing.sale.deliveryMethod}
            </p>
            <p className="mt-4 rounded-lg bg-[var(--surface)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--muted)]">
              {listing.description.autoDescription}
            </p>
          </div>
        </article>

        <div className="safe-bottom mt-6 grid gap-3 sm:grid-cols-2">
          <SecondaryButton onClick={onNewAnalysis}>{t.newAnalysis}</SecondaryButton>
          <PrimaryButton onClick={onViewMarketplace}>{t.marketplace}</PrimaryButton>
        </div>
      </div>
    </section>
  );
}
