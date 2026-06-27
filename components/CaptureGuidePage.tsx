import { buildCaptureGuide } from "@/constants/captureGuides";
import { getCategoryLabel } from "@/constants/flowerTaxonomy";
import type { FlowerInfoForm } from "@/types/flower";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "2단계 · 촬영 가이드",
  title: "입력한 식물 유형에 맞춰 이렇게 촬영해주세요",
  selected: "선택 정보",
  checklist: "촬영 체크리스트",
  payload: "서버 전달 요약",
  back: "정보 수정하기",
  start: "촬영 시작하기",
};

type CaptureGuidePageProps = {
  form: FlowerInfoForm;
  onBack: () => void;
  onStartCapture: () => void;
};

export function CaptureGuidePage({
  form,
  onBack,
  onStartCapture,
}: CaptureGuidePageProps) {
  const guide = buildCaptureGuide(form);
  const isPottedPlant = form.categoryType === "potted_plant";

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-5">
      <div className="mb-5">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-black">{t.title}</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
          <p className="text-sm font-black text-[var(--green-strong)]">
            {t.selected}
          </p>
          <h2 className="mt-2 text-2xl font-black">{guide.title}</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            {guide.description}
          </p>

          <dl className="mt-5 grid gap-3 text-sm">
            <InfoRow label="대기준" value={getCategoryLabel(form.categoryType)} />
            <InfoRow label="중기준" value={form.item} />
            <InfoRow label="소기준" value={form.cultivar} />
            <InfoRow label="class_id" value={form.cultivarClassId} />
            <InfoRow label="촬영 모드" value={guide.mode} />
          </dl>
        </article>

        <article className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
          <p className="text-sm font-black text-[var(--green-strong)]">
            {t.checklist}
          </p>
          <ul className="mt-4 grid gap-3">
            {guide.checklist.map((item, index) => (
              <li key={item} className="flex gap-3 leading-7 text-[var(--muted)]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgba(128,191,142,0.18)] text-sm font-black text-[var(--green-strong)]">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="mt-5 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
        <p className="text-sm font-black text-[var(--green-strong)]">
          {t.payload}
        </p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {isPottedPlant ? (
            <>
              <InfoRow label="화분 호수" value={`${form.potSizeHo}호`} />
              <InfoRow label="화분 윗지름" value={`${form.potTopDiameterCm}cm`} />
              <InfoRow label="화분 밑지름" value={`${form.potBottomDiameterCm}cm`} />
              <InfoRow label="화분 높이" value={`${form.potHeightCm}cm`} />
              <InfoRow label="잎 면적" value={form.leafArea} />
              <InfoRow label="줄기 길이" value={`${form.pottedStemLengthCm || "-"}cm`} />
              <InfoRow label="전체 생육" value={form.growthCondition} />
            </>
          ) : (
            <>
              <InfoRow label="꽃대/줄기 길이" value={`${form.stemLengthCm}cm`} />
              <InfoRow label="묶음 본수" value={`${form.bundleCount || "미입력"}본`} />
              <InfoRow label="개화 정도" value={form.floweringStage} />
              <InfoRow label="잎 면적" value={form.leafArea} />
              <InfoRow label="촬영 기준" value="자를 반드시 함께 촬영" />
            </>
          )}
        </div>
      </article>

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-5 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-2">
        <SecondaryButton onClick={onBack}>{t.back}</SecondaryButton>
        <PrimaryButton onClick={onStartCapture}>{t.start}</PrimaryButton>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <dt className="font-black text-[var(--ink)]">{label}</dt>
      <dd className="mt-1 font-semibold text-[var(--muted)]">{value || "-"}</dd>
    </div>
  );
}
