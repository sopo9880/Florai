"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  createProductListingDefaults,
  productListingRepository,
} from "@/services/productListingRepository";
import type { AuthUser } from "@/types/auth";
import type {
  AnalysisResult,
  CapturedImage,
  FlowerInfoForm,
} from "@/types/flower";
import type {
  ProductListing,
  ProductListingDraftFields,
  ProductDeliveryMethod,
  ProductSaleUnit,
} from "@/types/productListing";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const units: ProductSaleUnit[] = ["묶음", "화분", "개", "박스"];
const deliveryMethods: ProductDeliveryMethod[] = ["직접 픽업", "택배", "협의"];

const t = {
  eyebrow: "상품 게시",
  title: "AI 평가 결과로 판매 상품 초안을 만들어요",
  description:
    "AI 품질 분석 결과를 기반으로 상품 정보를 자동 채우고, 판매자가 가격과 수량을 확정합니다.",
  aiSnapshot: "AI 판정 스냅샷",
  saleInfo: "판매 정보 입력",
  preview: "게시 미리보기",
  warningTitle: "비정상 판정 상품입니다",
  warningBody:
    "품질 확인이 필요한 상품입니다. 게시 전 실제 상태를 다시 확인해 주세요.",
  publish: "상품 게시하기",
  back: "결과로 돌아가기",
  viewListings: "상품 목록 보기",
};

type ProductListingFormPageProps = {
  result: AnalysisResult;
  form: FlowerInfoForm;
  capturedImages: CapturedImage[];
  seller: AuthUser | null;
  onBack: () => void;
  onPublished: (listing: ProductListing) => void;
  onViewListings: () => void;
};

export function ProductListingFormPage({
  result,
  form,
  capturedImages,
  seller,
  onBack,
  onPublished,
  onViewListings,
}: ProductListingFormPageProps) {
  const defaults = useMemo(
    () => createProductListingDefaults({ result, form, capturedImages }),
    [capturedImages, form, result],
  );
  const [fields, setFields] = useState<ProductListingDraftFields>(defaults);
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = <K extends keyof ProductListingDraftFields>(
    key: K,
    value: ProductListingDraftFields[K],
  ) => {
    setErrorMessage("");
    setFields((current) => ({ ...current, [key]: value }));
  };

  const publish = () => {
    const price = Number(fields.price);
    const quantity = Number(fields.quantity);

    if (!fields.title.trim()) {
      setErrorMessage("상품명을 입력해 주세요.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage("판매 가격은 0보다 큰 숫자로 입력해 주세요.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrorMessage("판매 수량은 0보다 큰 숫자로 입력해 주세요.");
      return;
    }

    const listing = productListingRepository.create({
      source: { result, form, capturedImages },
      fields,
      seller,
    });

    onPublished(listing);
  };

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-5">
      <div className="mb-5">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-black">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--muted)]">
          {t.description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-4">
          <article className="overflow-hidden rounded-lg border border-white bg-white shadow-[var(--shadow)]">
            <img
              src={capturedImages[0].dataUrl}
              alt="상품 게시에 사용할 화훼 이미지"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="p-4">
              <p className="text-sm font-black">
                {form.cultivarClassName || form.item}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                판매자: {seller?.name || "판매자"} · 이미지 {capturedImages.length}장
              </p>
            </div>
            {capturedImages.length > 1 && (
              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                {capturedImages.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-lg border border-[var(--line)]"
                  >
                    <img
                      src={image.dataUrl}
                      alt={image.label}
                      className="aspect-square w-full object-cover"
                    />
                    <p className="truncate px-2 py-1 text-[10px] font-black">
                      {image.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">{t.aiSnapshot}</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <MetaRow
                label="정상 여부"
                value={result.condition === "normal" ? "정상" : "비정상"}
              />
              <MetaRow label="등급 후보" value={result.grade} />
              <MetaRow
                label="신뢰도"
                value={`${Math.round(result.confidence)}%`}
              />
              <MetaRow label="품목" value={form.item} />
              <MetaRow label="품종" value={form.cultivar} />
            </div>
          </article>

          {result.condition === "abnormal" && (
            <article className="rounded-lg border border-[rgba(244,166,166,0.65)] bg-[var(--pink-soft)] p-5 shadow-sm">
              <h2 className="text-base font-black text-[#9d4949]">
                {t.warningTitle}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#9d4949]">
                {t.warningBody}
              </p>
            </article>
          )}
        </div>

        <div className="grid gap-4">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">{t.saleInfo}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="상품명" className="sm:col-span-2">
                <input
                  value={fields.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="판매 가격">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="예: 25000"
                  value={fields.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="판매 수량">
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={fields.quantity}
                  onChange={(event) =>
                    updateField("quantity", event.target.value)
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="판매 단위">
                <select
                  value={fields.unit}
                  onChange={(event) =>
                    updateField("unit", event.target.value as ProductSaleUnit)
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="출하 가능일">
                <input
                  type="date"
                  value={fields.availableFrom}
                  onChange={(event) =>
                    updateField("availableFrom", event.target.value)
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="판매 지역">
                <input
                  placeholder="예: 광주 화훼시장"
                  value={fields.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="배송/픽업">
                <select
                  value={fields.deliveryMethod}
                  onChange={(event) =>
                    updateField(
                      "deliveryMethod",
                      event.target.value as ProductDeliveryMethod,
                    )
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                >
                  {deliveryMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="판매자 메모" className="sm:col-span-2">
                <textarea
                  rows={4}
                  placeholder="상태, 픽업 조건, 주의사항 등을 적어주세요."
                  value={fields.sellerMemo}
                  onChange={(event) =>
                    updateField("sellerMemo", event.target.value)
                  }
                  className="w-full resize-none rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold leading-6"
                />
              </Field>
            </div>

            {errorMessage && (
              <p className="mt-4 rounded-lg bg-[var(--pink-soft)] px-4 py-3 text-sm font-bold text-[#9d4949]">
                {errorMessage}
              </p>
            )}
          </article>

          <ListingPreview fields={fields} result={result} form={form} />
        </div>
      </div>

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-3">
        <SecondaryButton onClick={onBack}>{t.back}</SecondaryButton>
        <SecondaryButton onClick={onViewListings}>
          {t.viewListings}
        </SecondaryButton>
        <PrimaryButton onClick={publish}>{t.publish}</PrimaryButton>
      </div>
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid gap-2 text-sm font-black ${className}`}>
      {label}
      {children}
    </label>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-[var(--surface)] px-4 py-3">
      <span className="font-black text-[var(--ink)]">{label}</span>
      <span className="text-right font-semibold text-[var(--muted)]">
        {value || "-"}
      </span>
    </div>
  );
}

function ListingPreview({
  fields,
  result,
  form,
}: {
  fields: ProductListingDraftFields;
  result: AnalysisResult;
  form: FlowerInfoForm;
}) {
  const price = Number(fields.price || 0);
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-black">{t.preview}</h2>
      <div className="mt-4 rounded-lg bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--green)] px-3 py-1 text-xs font-black text-[var(--green-strong)]">
            AI {result.grade}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--muted)]">
            {form.categoryType === "potted_plant" ? "분화류" : "절화류"}
          </span>
        </div>
        <p className="mt-3 text-lg font-black">
          {fields.title || "상품명 미입력"}
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
          {price > 0 ? `${price.toLocaleString()}원` : "가격 미입력"} ·{" "}
          {fields.quantity || "-"}
          {fields.unit} · {fields.location || "지역 미입력"}
        </p>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">
          {result.summary}
        </p>
      </div>
    </article>
  );
}
