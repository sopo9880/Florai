import { CSSProperties, FormEvent, useMemo, useState } from "react";
import {
  FLOWER_CATEGORY_OPTIONS,
  getCategoryLabel,
  getItemsByCategory,
} from "@/constants/flowerTaxonomy";
import {
  findFlowerClassByCultivarClassId,
  getCultivarsByItem,
} from "@/constants/flowerClassList";
import { findPotSizeByHo, POT_SIZE_OPTIONS } from "@/constants/potSizes";
import type { CategoryType, FlowerInfoForm } from "@/types/flower";
import { Field, SelectInput, TextAreaInput, TextInput } from "./InfoInput";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  eyebrow: "1단계 · 식물 정보 입력",
  title: "촬영 전에 품목과 판별 조건을 먼저 입력해주세요",
  supportNotice:
    "선택한 대기준에 따라 필요한 입력 항목과 촬영 가이드가 달라집니다. 입력값은 품질 판정과 근거 리포트 생성에 함께 활용됩니다.",
  categoryType: "대기준",
  item: "중기준 · 품목",
  cultivar: "소기준 · 품종",
  selectedClass: "선택 품종",
  categorySelect: "대기준을 선택해주세요",
  itemSelect: "품목을 선택해주세요",
  cultivarSelect: "품종을 선택해주세요",
  cultivarDisabled: "먼저 품목을 선택해주세요",
  cutSection: "절화류 판별 정보",
  pottedSection: "분화류 판별 정보",
  cutStemLengthCm: "꽃대 길이(cm)",
  stemLengthCm: "꽃대/줄기 길이(cm)",
  stemPlaceholder: "예: 65",
  bundleCount: "묶음 본수",
  bundlePlaceholder: "예: 10",
  floweringStage: "개화 정도",
  leafArea: "잎 면적",
  leafAreaPlaceholder: "예: 35 또는 대략적인 잎 면적",
  potSize: "화분 호수",
  pottedStemLengthCm: "줄기 길이(cm)",
  pottedStemLengthPlaceholder: "예: 28",
  floweringStatus: "개화 여부",
  growthCondition: "전체 생육 상태",
  shippedAt: "촬영/출하일",
  memo: "특이사항",
  memoPlaceholder: "예: 일부 꽃잎 끝이 마름, 잎 끝 갈변, 줄기 약간 휘어짐 등",
  back: "처음으로",
  submit: "촬영 가이드 보기",
};

const floweringStageOptions = ["미개화/과개화", "4/5 개화", "완전 개화", "확인 필요"];
const floweringStatusOptions = ["꽃 없음", "개화 전", "개화 중", "만개", "시듦"];
const growthConditionOptions = ["왜소", "생육 보통", "균형 양호", "웃자람", "이상 의심"];

const cutFlowerBloomProgress: Record<string, number> = {
  "미개화/과개화": 0.26,
  "4/5 개화": 0.72,
  "완전 개화": 1,
  "확인 필요": 0.48,
};

const pottedFlowerBloomProgress: Record<string, number> = {
  "꽃 없음": 0,
  "개화 전": 0.28,
  "개화 중": 0.64,
  "만개": 1,
  "시듦": 0.74,
};

function defaultCategoryValues(categoryType: CategoryType) {
  if (categoryType === "potted_plant") {
    return {
      stemLengthCm: "",
      bundleCount: "",
      floweringStage: "",
      leafArea: "",
      potSizeHo: "",
      potTopDiameterCm: "",
      potBottomDiameterCm: "",
      potHeightCm: "",
      pottedStemLengthCm: "",
      floweringStatus: "꽃 없음",
      growthCondition: "균형 양호",
      shootingPart: "화분 포함 전체" as const,
    };
  }

  return {
    stemLengthCm: "",
    bundleCount: "10",
    floweringStage: "4/5 개화",
    leafArea: "",
    potSizeHo: "",
    potTopDiameterCm: "",
    potBottomDiameterCm: "",
    potHeightCm: "",
    pottedStemLengthCm: "",
    floweringStatus: "",
    growthCondition: "",
    shootingPart: "줄기 포함" as const,
  };
}

type FlowerInfoFormPageProps = {
  form: FlowerInfoForm;
  errorMessage?: string;
  onBack: () => void;
  onSubmit: (form: FlowerInfoForm) => void;
};

export function FlowerInfoFormPage({
  form,
  errorMessage,
  onBack,
  onSubmit,
}: FlowerInfoFormPageProps) {
  const [draft, setDraft] = useState<FlowerInfoForm>(form);
  const itemOptions = useMemo(
    () => getItemsByCategory(draft.categoryType),
    [draft.categoryType],
  );
  const cultivarOptions = useMemo(
    () => getCultivarsByItem(draft.itemId),
    [draft.itemId],
  );
  const selectedPotSize = findPotSizeByHo(draft.potSizeHo);

  const update = <K extends keyof FlowerInfoForm>(
    key: K,
    value: FlowerInfoForm[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleCategoryChange = (categoryType: CategoryType) => {
    setDraft((current) => ({
      ...current,
      ...defaultCategoryValues(categoryType),
      categoryType,
      itemId: "",
      item: "",
      cultivarId: "",
      cultivar: "",
      cultivarClassId: "",
      cultivarClassName: "",
    }));
  };

  const handleItemChange = (itemId: string) => {
    const selectedItem = itemOptions.find((option) => option.itemId === itemId);

    setDraft((current) => ({
      ...current,
      itemId,
      item: selectedItem?.item ?? "",
      cultivarId: "",
      cultivar: "",
      cultivarClassId: "",
      cultivarClassName: "",
    }));
  };

  const handleCultivarChange = (cultivarClassId: string) => {
    const selectedClass = findFlowerClassByCultivarClassId(cultivarClassId);

    setDraft((current) => ({
      ...current,
      cultivarClassId,
      itemId: selectedClass?.itemId ?? current.itemId,
      item: selectedClass?.item ?? current.item,
      cultivarId: selectedClass?.cultivarId ?? "",
      cultivar: selectedClass?.cultivar ?? "",
      cultivarClassName: selectedClass?.cultivarClassName ?? "",
    }));
  };

  const handlePotChange = (potSizeHo: string) => {
    const pot = findPotSizeByHo(potSizeHo);

    setDraft((current) => ({
      ...current,
      potSizeHo,
      potTopDiameterCm: pot ? String(pot.topDiameterCm) : "",
      potBottomDiameterCm: pot ? String(pot.bottomDiameterCm) : "",
      potHeightCm: pot ? String(pot.heightCm) : "",
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(draft);
  };

  const isCutFlower = draft.categoryType === "cut_flower";

  return (
    <section className="florai-shell min-h-[calc(100svh-4rem)] py-5">
      <div className="mb-5">
        <p className="text-sm font-extrabold text-[var(--green-strong)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-black">{t.title}</h1>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-lg border border-[rgba(244,166,166,0.7)] bg-[var(--pink-soft)] px-4 py-3 text-sm font-bold leading-6 text-[#9d4545]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
          <p className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--muted)]">
            {t.supportNotice}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.categoryType} required>
              <SelectInput
                value={draft.categoryType}
                required
                onChange={(event) =>
                  handleCategoryChange(event.target.value as CategoryType)
                }
              >
                <option value="">{t.categorySelect}</option>
                {FLOWER_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label={t.item} required>
              <SelectInput
                value={draft.itemId}
                required
                onChange={(event) => handleItemChange(event.target.value)}
              >
                <option value="">{t.itemSelect}</option>
                {itemOptions.map((option) => (
                  <option key={option.itemId} value={option.itemId}>
                    {option.item}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label={t.cultivar} required>
              <SelectInput
                value={draft.cultivarClassId}
                required
                disabled={!draft.itemId}
                onChange={(event) => handleCultivarChange(event.target.value)}
              >
                <option value="">
                  {draft.itemId ? t.cultivarSelect : t.cultivarDisabled}
                </option>
                {cultivarOptions.map((option) => (
                  <option
                    key={option.cultivarClassId}
                    value={option.cultivarClassId}
                  >
                    {option.cultivar}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          {draft.cultivarClassName && (
            <div className="rounded-lg border border-[rgba(128,191,142,0.35)] bg-[rgba(128,191,142,0.1)] px-4 py-3 text-sm font-bold leading-6 text-[var(--green-strong)]">
              {t.selectedClass}: {getCategoryLabel(draft.categoryType)} / {draft.item} / {draft.cultivar}
            </div>
          )}
        </div>

        {isCutFlower ? (
          <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
            <h2 className="text-lg font-black">{t.cutSection}</h2>
            <p className="text-sm font-semibold leading-6 text-[var(--muted)]">
              절화류는 꽃대 길이, 묶음 본수, 잎 면적과 개화 정도를 중심으로 입력합니다.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label={t.cutStemLengthCm} required helper="촬영 시 자를 함께 놓으면 길이 추정 안정성이 올라갑니다.">
                <TextInput
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={draft.stemLengthCm}
                  required
                  onChange={(event) => update("stemLengthCm", event.target.value)}
                  placeholder={t.stemPlaceholder}
                />
              </Field>
              <Field label={t.bundleCount} helper="묶음 단위 판별이 필요한 경우 입력해주세요.">
                <TextInput
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={draft.bundleCount}
                  onChange={(event) => update("bundleCount", event.target.value)}
                  placeholder={t.bundlePlaceholder}
                />
              </Field>
              <Field label={t.leafArea} required helper="정확한 수치가 없으면 대략값을 입력해도 됩니다.">
                <TextInput
                  value={draft.leafArea}
                  required
                  onChange={(event) => update("leafArea", event.target.value)}
                  placeholder={t.leafAreaPlaceholder}
                />
              </Field>
            </div>
            <StageSlider
              label={t.floweringStage}
              value={draft.floweringStage}
              options={floweringStageOptions}
              visualKind="cutFlower"
              size="large"
              onChange={(value) => update("floweringStage", value)}
            />
          </div>
        ) : (
          <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
            <h2 className="text-lg font-black">{t.pottedSection}</h2>
            <p className="text-sm font-semibold leading-6 text-[var(--muted)]">
              분화류는 화분 호수, 잎 면적, 줄기 길이와 생육·개화 상태를 중심으로 입력합니다.
            </p>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <Field
                label={t.potSize}
                required
                helper={selectedPotSize ? `규격 ${selectedPotSize.topDiameterCm}/${selectedPotSize.bottomDiameterCm}/${selectedPotSize.heightCm}cm` : "호수만 간단히 선택해주세요."}
              >
                <SelectInput
                  value={draft.potSizeHo}
                  required
                  onChange={(event) => handlePotChange(event.target.value)}
                >
                  <option value="">화분 호수</option>
                  {POT_SIZE_OPTIONS.map((option) => (
                    <option key={option.ho} value={option.ho}>
                      {option.ho}호
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t.leafArea} required helper="잎 면적 정보를 전달합니다.">
                <TextInput
                  value={draft.leafArea}
                  required
                  onChange={(event) => update("leafArea", event.target.value)}
                  placeholder={t.leafAreaPlaceholder}
                />
              </Field>
              <Field label={t.pottedStemLengthCm} required helper={selectedPotSize ? `화분 ${selectedPotSize.ho}호 기준` : undefined}>
                <TextInput
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={draft.pottedStemLengthCm}
                  required
                  onChange={(event) => update("pottedStemLengthCm", event.target.value)}
                  placeholder={t.pottedStemLengthPlaceholder}
                />
              </Field>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <StageSlider
                label={t.growthCondition}
                value={draft.growthCondition}
                options={growthConditionOptions}
                visualKind="growth"
                onChange={(value) => update("growthCondition", value)}
              />
              <StageSlider
                label={t.floweringStatus}
                value={draft.floweringStatus}
                options={floweringStatusOptions}
                visualKind="pottedFlower"
                onChange={(value) => update("floweringStatus", value)}
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.shippedAt}>
              <TextInput
                type="date"
                value={draft.shippedAt}
                onChange={(event) => update("shippedAt", event.target.value)}
              />
            </Field>
            <Field label="촬영 부위">
              <TextInput value={draft.shootingPart} readOnly />
            </Field>
          </div>
          <Field label={t.memo}>
            <TextAreaInput
              value={draft.memo}
              onChange={(event) => update("memo", event.target.value)}
              placeholder={t.memoPlaceholder}
            />
          </Field>
        </div>

        <div className="safe-bottom sticky bottom-0 -mx-4 grid gap-3 bg-[linear-gradient(180deg,rgba(255,253,248,0),var(--surface)_22%)] px-4 pt-6 sm:grid-cols-2">
          <SecondaryButton type="button" onClick={onBack}>{t.back}</SecondaryButton>
          <PrimaryButton type="submit">{t.submit}</PrimaryButton>
        </div>
      </form>
    </section>
  );
}

type StageVisualKind = "cutFlower" | "pottedFlower" | "growth";

type StageSliderProps = {
  label: string;
  value: string;
  options: string[];
  visualKind: StageVisualKind;
  size?: "normal" | "large";
  onChange: (value: string) => void;
};

function StageSlider({
  label,
  value,
  options,
  visualKind,
  size = "normal",
  onChange,
}: StageSliderProps) {
  const selectedIndex = Math.max(0, options.indexOf(value));
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const progress = options.length > 1 ? (safeIndex / (options.length - 1)) * 100 : 0;
  const inputId = `${label.replace(/\s/g, "-")}-stage-slider`;

  return (
    <div
      className={`stage-slider-card ${visualKind === "cutFlower" ? "is-cut-slider" : "is-potted-slider"} ${size === "large" ? "is-large" : ""}`}
      style={{ "--stage-count": options.length } as CSSProperties}
    >
      <div className="stage-slider-visual-wrap">
        <div>
          <p className="stage-slider-label">{label}</p>
          <p className="stage-slider-value">{options[safeIndex]}</p>
        </div>
        <StageVisual kind={visualKind} value={options[safeIndex]} index={safeIndex} total={options.length} />
      </div>

      <div className="stage-slider-axis">
        <div className="stage-slider-axis-inner">
          <label className="sr-only" htmlFor={inputId}>{label}</label>
          <input
            id={inputId}
            className="stage-slider-range"
            type="range"
            min={0}
            max={Math.max(0, options.length - 1)}
            step={1}
            value={safeIndex}
            onChange={(event) => onChange(options[Number(event.target.value)] ?? options[0] ?? "")}
            style={{
              background: `linear-gradient(90deg, rgba(52,123,84,0.88) 0 ${progress}%, rgba(221,232,223,0.95) ${progress}% 100%)`,
            }}
          />

          <div className="stage-slider-ticks" aria-hidden="true">
            {options.map((option, index) => (
              <span
                key={option}
                className={index <= safeIndex ? "is-active" : undefined}
                style={{ "--stage-left": `${options.length > 1 ? (index / (options.length - 1)) * 100 : 0}%` } as CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="stage-slider-options">
          {options.map((option, index) => (
            <button
              type="button"
              key={option}
              className={index === safeIndex ? "is-selected" : undefined}
              style={{ "--stage-left": `${options.length > 1 ? (index / (options.length - 1)) * 100 : 0}%` } as CSSProperties}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StageVisual({
  kind,
  value,
  index,
  total,
}: {
  kind: StageVisualKind;
  value: string;
  index: number;
  total: number;
}) {
  if (kind === "growth") {
    return <GrowthVisual value={value} index={index} />;
  }

  const progress = kind === "cutFlower"
    ? cutFlowerBloomProgress[value] ?? normalizedProgress(index, total)
    : pottedFlowerBloomProgress[value] ?? normalizedProgress(index, total);
  const isWilted = value === "시듦" || value === "확인 필요";

  return (
    <div className={`stage-flower-visual ${kind === "pottedFlower" ? "is-potted" : "is-cut"} ${isWilted ? "is-wilted" : ""}`}>
      {kind === "pottedFlower" ? <div className="stage-pot" /> : <div className="stage-ruler" />}
      <div className="stage-stem" />
      <div className="stage-leaf stage-leaf-left" />
      <div className="stage-leaf stage-leaf-right" />
      <div
        className="stage-flower-head"
        style={{
          transform: `translate(-50%, -50%) scale(${0.72 + progress * 0.24})`,
        }}
      >
        {Array.from({ length: 8 }).map((_, petalIndex) => {
          const angle = petalIndex * 45;
          const lift = -4 - progress * 9;
          const petalScale = 0.56 + progress * 0.48;
          const tilt = isWilted ? 10 : 0;

          return (
            <span
              key={petalIndex}
              style={{
                opacity: 0.38 + progress * 0.56,
                transform: `rotate(${angle + tilt}deg) translateY(${lift}px) scale(${petalScale})`,
              }}
            />
          );
        })}
      </div>
      <div className="stage-flower-core" />
    </div>
  );
}

function GrowthVisual({ value, index }: { value: string; index: number }) {
  const preset = getGrowthPreset(value, index);
  const style = {
    "--growth-height": `${preset.height}rem`,
    "--growth-leaf-scale": preset.leafScale,
    "--growth-lean": `${preset.lean}deg`,
    "--growth-opacity": preset.opacity,
  } as CSSProperties;

  return (
    <div className={`stage-growth-visual ${preset.isConcern ? "is-concern" : ""}`} style={style}>
      <div className="stage-growth-pot" />
      <div className="stage-growth-stem" />
      <div className="stage-growth-leaf left top" />
      <div className="stage-growth-leaf left bottom" />
      <div className="stage-growth-leaf right top" />
      <div className="stage-growth-leaf right bottom" />
    </div>
  );
}

function normalizedProgress(index: number, total: number) {
  if (total <= 1) return 1;
  return index / (total - 1);
}

function getGrowthPreset(value: string, index: number) {
  if (value === "균형 양호") {
    return { height: 4.9, leafScale: 1.04, lean: 0, opacity: 1, isConcern: false };
  }
  if (value === "생육 보통") {
    return { height: 4.1, leafScale: 0.88, lean: -2, opacity: 0.88, isConcern: false };
  }
  if (value === "웃자람") {
    return { height: 6.1, leafScale: 0.72, lean: 4, opacity: 0.82, isConcern: false };
  }
  if (value === "왜소") {
    return { height: 3.25, leafScale: 0.66, lean: -1, opacity: 0.78, isConcern: false };
  }
  if (value === "이상 의심") {
    return { height: 3.8, leafScale: 0.62, lean: 9, opacity: 0.58, isConcern: true };
  }

  const progress = normalizedProgress(index, growthConditionOptions.length);
  return {
    height: 3.5 + progress * 2,
    leafScale: 0.7 + progress * 0.25,
    lean: 0,
    opacity: 0.85,
    isConcern: false,
  };
}
