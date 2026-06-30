"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  createPurchaseDefaults,
  purchaseOrderRepository,
} from "@/services/purchaseOrderRepository";
import type { AuthUser } from "@/types/auth";
import type { ProductDeliveryMethod, ProductListing } from "@/types/productListing";
import type {
  PurchaseOrder,
  PurchaseOrderFields,
  PurchasePaymentMethod,
} from "@/types/purchaseOrder";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const deliveryMethods: ProductDeliveryMethod[] = ["직접 픽업", "택배", "협의"];
const paymentMethods: PurchasePaymentMethod[] = ["현장 결제", "계좌 이체", "협의"];

const t = {
  eyebrow: "상품 구매",
  title: "구매 요청 정보를 입력해요",
  description:
    "구매 수량과 수령 방식을 입력하면 판매자에게 구매 요청이 생성됩니다.",
  productInfo: "구매 상품",
  buyerInfo: "구매자 정보",
  orderPreview: "주문 미리보기",
  purchase: "구매 요청하기",
  back: "상품 목록으로",
  orderHistory: "구매 내역 보기",
  ownListingTitle: "본인이 등록한 상품입니다",
  ownListingBody: "판매자가 직접 등록한 상품은 같은 계정으로 구매할 수 없습니다.",
};

type ProductPurchasePageProps = {
  listing: ProductListing;
  buyer: AuthUser | null;
  onBack: () => void;
  onPurchased: (order: PurchaseOrder) => void;
  onViewOrders: () => void;
};

export function ProductPurchasePage({
  listing,
  buyer,
  onBack,
  onPurchased,
  onViewOrders,
}: ProductPurchasePageProps) {
  const defaults = useMemo(() => createPurchaseDefaults(listing, buyer), [buyer, listing]);
  const isOwnListing = Boolean(buyer && buyer.userId === listing.seller.sellerId);
  const [fields, setFields] = useState<PurchaseOrderFields>(defaults);
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = <K extends keyof PurchaseOrderFields>(
    key: K,
    value: PurchaseOrderFields[K],
  ) => {
    setErrorMessage("");
    setFields((current) => ({ ...current, [key]: value }));
  };

  const submitPurchase = () => {
    if (isOwnListing) {
      setErrorMessage(t.ownListingBody);
      return;
    }

    const quantity = Number(fields.quantity);

    if (!fields.buyerName.trim()) {
      setErrorMessage("구매자 이름을 입력해 주세요.");
      return;
    }

    if (!fields.buyerPhone.trim()) {
      setErrorMessage("연락처를 입력해 주세요.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrorMessage("구매 수량은 0보다 큰 숫자로 입력해 주세요.");
      return;
    }

    if (quantity > listing.sale.quantity) {
      setErrorMessage(`현재 구매 가능 수량은 ${listing.sale.quantity}${listing.sale.unit}입니다.`);
      return;
    }

    const order = purchaseOrderRepository.create({ listing, fields, buyer });
    onPurchased(order);
  };

  const quantity = Number(fields.quantity || 0);
  const totalPrice = Math.max(0, quantity) * listing.sale.price;

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
        {isOwnListing && (
          <p className="mt-4 max-w-3xl rounded-lg bg-[var(--pink-soft)] px-4 py-3 text-sm font-bold leading-6 text-[#9d4949]">
            {t.ownListingBody}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="grid gap-4">
          <article className="overflow-hidden rounded-lg border border-white bg-white shadow-[var(--shadow)]">
            <img
              src={listing.image.dataUrl}
              alt={`${listing.product.title} 상품 이미지`}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--green)] px-3 py-1 text-xs font-black text-[var(--green-strong)]">
                  AI {listing.quality.grade}
                </span>
                <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                  {listing.product.categoryLabel}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-black">{listing.product.title}</h2>
              <p className="mt-2 text-2xl font-black text-[var(--green-strong)]">
                {listing.sale.price.toLocaleString()}원
              </p>
              <dl className="mt-4 grid gap-2 text-sm">
                <MetaRow label="남은 수량" value={`${listing.sale.quantity}${listing.sale.unit}`} />
                <MetaRow label="출하 가능일" value={listing.sale.availableFrom || "-"} />
                <MetaRow label="판매 지역" value={listing.sale.location || "-"} />
                <MetaRow label="판매자" value={listing.seller.sellerName} />
              </dl>
              <p className="mt-4 rounded-lg bg-[var(--surface)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--muted)]">
                {listing.description.autoDescription}
              </p>
            </div>
          </article>
        </div>

        <div className="grid gap-4">
          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">{t.buyerInfo}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="구매자 이름">
                <input
                  value={fields.buyerName}
                  onChange={(event) => updateField("buyerName", event.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="연락처">
                <input
                  value={fields.buyerPhone}
                  onChange={(event) => updateField("buyerPhone", event.target.value)}
                  placeholder="예: 010-0000-0000"
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="구매 수량">
                <input
                  type="number"
                  min="1"
                  max={listing.sale.quantity}
                  inputMode="numeric"
                  value={fields.quantity}
                  onChange={(event) => updateField("quantity", event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="희망 수령일">
                <input
                  type="date"
                  value={fields.desiredDate}
                  onChange={(event) => updateField("desiredDate", event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                />
              </Field>

              <Field label="수령 방식">
                <select
                  value={fields.deliveryMethod}
                  onChange={(event) =>
                    updateField("deliveryMethod", event.target.value as ProductDeliveryMethod)
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

              <Field label="결제 방식">
                <select
                  value={fields.paymentMethod}
                  onChange={(event) =>
                    updateField("paymentMethod", event.target.value as PurchasePaymentMethod)
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 font-semibold"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="구매자 메모" className="sm:col-span-2">
                <textarea
                  rows={4}
                  value={fields.buyerMemo}
                  onChange={(event) => updateField("buyerMemo", event.target.value)}
                  placeholder="픽업 시간, 요청사항 등을 적어주세요."
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

          <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">{t.orderPreview}</h2>
            <div className="mt-4 rounded-lg bg-[var(--surface)] p-4">
              <p className="text-lg font-black">{listing.product.title}</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <MetaRow label="단가" value={`${listing.sale.price.toLocaleString()}원`} />
                <MetaRow label="수량" value={`${fields.quantity || "-"}${listing.sale.unit}`} />
                <MetaRow label="수령 방식" value={fields.deliveryMethod} />
                <MetaRow label="결제 방식" value={fields.paymentMethod} />
              </dl>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3">
                <span className="text-sm font-black">총 결제 예정 금액</span>
                <span className="text-xl font-black text-[var(--green-strong)]">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-3">
        <SecondaryButton onClick={onBack}>{t.back}</SecondaryButton>
        <SecondaryButton onClick={onViewOrders}>{t.orderHistory}</SecondaryButton>
        <PrimaryButton onClick={submitPurchase} disabled={listing.sale.quantity <= 0 || isOwnListing}>
          {listing.sale.quantity <= 0 ? "품절" : isOwnListing ? t.ownListingTitle : t.purchase}
        </PrimaryButton>
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
