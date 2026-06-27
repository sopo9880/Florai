"use client";

import { useMemo, useState } from "react";
import { getCategoryLabel } from "@/constants/flowerTaxonomy";
import type {
  AnalysisResult,
  CapturedImage,
  FlowerInfoForm,
} from "@/types/flower";
import { GradeCard } from "./GradeCard";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "품질 리포트",
  title: "판별 결과를 확인해주세요",
  analyzedPhoto: "분석 이미지",
  multiImage: "멀티뷰 분석",
  perImageFindings: "촬영 뷰별 분석",
  analyzedPhotoAlt: "등급 판별에 사용된 화훼 이미지",
  confidence: "판정 신뢰도",
  selectedInfo: "선택 정보",
  summary: "요약",
  reasons: "판단 근거",
  measurements: "입력/측정 정보",
  evidence: "표준규격 근거",
  warnings: "주의 사항",
  recommendation: "추천",
  disclaimer:
    "본 결과는 AI 기반 참고용 판별 결과이며, 최종 등급은 실제 검수 기준과 현장 판단에 따라 달라질 수 있습니다.",
  retake: "다시 촬영하기",
  restart: "새 분석 시작하기",
  publish: "상품 게시하기",
};

type ResultReportPageProps = {
  result: AnalysisResult;
  form: FlowerInfoForm;
  capturedImages: CapturedImage[];
  onRetake: () => void;
  onRestart: () => void;
  onPublish: () => void;
};

export function ResultReportPage({
  result,
  form,
  capturedImages,
  onRetake,
  onRestart,
  onPublish,
}: ResultReportPageProps) {
  const [selectedImageId, setSelectedImageId] = useState(
    capturedImages[0]?.id || "",
  );
  const selectedImage = useMemo(
    () =>
      capturedImages.find((image) => image.id === selectedImageId) ??
      capturedImages[0],
    [capturedImages, selectedImageId],
  );
  const imageCount = result.imageCount || capturedImages.length;

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-5">
      <div className="mb-5">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-black">{t.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.82fr_1.18fr]">
        <div className="grid gap-4">
          <article className="overflow-hidden rounded-lg border border-white bg-white shadow-[var(--shadow)]">
            <img
              src={selectedImage.dataUrl}
              alt={t.analyzedPhotoAlt}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="p-4">
              <p className="text-sm font-black">{t.analyzedPhoto}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                {form.cultivarClassName} · {t.confidence}{" "}
                {Math.round(result.confidence)}%
              </p>
              <p className="mt-2 rounded-lg bg-[var(--green-soft)] px-3 py-2 text-xs font-black text-[var(--green-strong)]">
                총 {imageCount}장의 이미지를 기반으로 분석했습니다.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {capturedImages.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageId(image.id)}
                    className={`overflow-hidden rounded-lg border text-left ${
                      selectedImage.id === image.id
                        ? "border-[var(--green)]"
                        : "border-[var(--line)]"
                    }`}
                  >
                    <img
                      src={image.dataUrl}
                      alt={image.label}
                      className="aspect-square w-full object-cover"
                    />
                    <p className="truncate px-2 py-1 text-[10px] font-black">
                      {image.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </article>
          <GradeCard
            condition={result.condition}
            grade={result.grade}
            confidence={result.confidence}
          />
          <ReportMeta
            title={t.selectedInfo}
            items={[
              ["대기준", getCategoryLabel(form.categoryType)],
              ["중기준", form.item],
              ["소기준", form.cultivar],
              ["class_id", form.cultivarClassId],
            ]}
          />
        </div>

        <div className="grid gap-4">
          <ReportSection title={t.summary} body={result.summary} />
          {result.measurements && result.measurements.length > 0 && (
            <ReportMeta
              title={t.measurements}
              items={result.measurements.map((item) => [
                item.label,
                item.value,
              ])}
            />
          )}
          <ReportList title={t.reasons} items={result.reasons} />
          {result.perImageFindings && result.perImageFindings.length > 0 && (
            <ReportImageFindings
              title={t.perImageFindings}
              items={result.perImageFindings}
            />
          )}
          {result.evidence && result.evidence.length > 0 && (
            <ReportEvidence title={t.evidence} items={result.evidence} />
          )}
          <ReportList title={t.warnings} items={result.warnings} warning />
          <ReportSection
            title={t.recommendation}
            body={result.recommendation}
            accent
          />
        </div>
      </div>

      <p className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-semibold leading-6 text-[var(--muted)]">
        {t.disclaimer}
      </p>

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-3">
        <SecondaryButton onClick={onRetake}>{t.retake}</SecondaryButton>
        <SecondaryButton onClick={onRestart}>{t.restart}</SecondaryButton>
        <PrimaryButton onClick={onPublish}>{t.publish}</PrimaryButton>
      </div>
    </section>
  );
}

function ReportSection({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm ${
        accent ? "border-[rgba(244,166,166,0.55)] bg-[var(--pink-soft)]" : ""
      }`}
    >
      <h2 className="text-base font-black">{title}</h2>
      <p className="mt-3 leading-7 text-[var(--muted)]">{body}</p>
    </article>
  );
}

function ReportList({
  title,
  items,
  warning,
}: {
  title: string;
  items: string[];
  warning?: boolean;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-black">{title}</h2>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-7 text-[var(--muted)]">
            <span
              className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                warning ? "bg-[var(--pink)]" : "bg-[var(--green)]"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ReportMeta({ title, items }: { title: string; items: string[][] }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-black">{title}</h2>
      <dl className="mt-3 grid gap-2 text-sm">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 rounded-lg bg-[var(--surface)] px-4 py-3"
          >
            <dt className="font-black text-[var(--ink)]">{label}</dt>
            <dd className="text-right font-semibold text-[var(--muted)]">
              {value || "-"}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ReportImageFindings({
  title,
  items,
}: {
  title: string;
  items: NonNullable<AnalysisResult["perImageFindings"]>;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-black">{title}</h2>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div
            key={`${item.view}-${item.label}`}
            className="rounded-lg bg-[var(--surface)] px-4 py-3"
          >
            <p className="font-black">{item.label}</p>
            <ul className="mt-2 grid gap-1 text-sm font-semibold leading-6 text-[var(--muted)]">
              {item.findings.map((finding) => (
                <li key={finding} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

function ReportEvidence({
  title,
  items,
}: {
  title: string;
  items: NonNullable<AnalysisResult["evidence"]>;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-black">{title}</h2>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg bg-[var(--surface)] px-4 py-3"
          >
            <p className="font-black">{item.title}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
