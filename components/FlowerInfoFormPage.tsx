import { FormEvent, useMemo, useState } from "react";
import {
  FLOWER_CATEGORY_OPTIONS,
  getCategoryLabel,
  getItemsByCategory,
} from "@/constants/flowerTaxonomy";
import {
  findFlowerClassByCultivarClassId,
  getCultivarsByItem,
} from "@/constants/flowerClassList";
import { findPotSizeByHo, formatPotSize, POT_SIZE_OPTIONS } from "@/constants/potSizes";
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

const floweringStageOptions = ["4/5 개화", "완전 개화", "미개화/과개화", "확인 필요"];
const floweringStatusOptions = ["꽃 없음", "개화 전", "개화 중", "만개", "시듦"];
const growthConditionOptions = ["균형 양호", "생육 보통", "웃자람", "왜소", "이상 의심"];

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
              절화류는 개화 정도, 줄기 신장, 잎 면적을 중심으로 입력합니다.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.stemLengthCm} required helper="절화류는 촬영 시 자를 반드시 함께 놓고 찍어야 길이 추정 안정성이 올라갑니다.">
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
              <Field label={t.floweringStage} required>
                <OptionSelect
                  value={draft.floweringStage}
                  options={floweringStageOptions}
                  onChange={(value) => update("floweringStage", value)}
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
          </div>
        ) : (
          <div className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
            <h2 className="text-lg font-black">{t.pottedSection}</h2>
            <p className="text-sm font-semibold leading-6 text-[var(--muted)]">
              분화류는 화분 규격, 잎 면적, 줄기 길이, 전체 생육 상태를 중심으로 입력합니다. 화분은 이미지 내 기준 물체로 활용됩니다.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.potSize} required helper="화분 규격은 이미지 내 크기 기준 물체로 사용됩니다.">
                <SelectInput
                  value={draft.potSizeHo}
                  required
                  onChange={(event) => handlePotChange(event.target.value)}
                >
                  <option value="">화분 호수를 선택해주세요</option>
                  {POT_SIZE_OPTIONS.map((option) => (
                    <option key={option.ho} value={option.ho}>
                      {formatPotSize(option)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <div className="rounded-lg border border-[rgba(128,191,142,0.35)] bg-[rgba(128,191,142,0.1)] px-4 py-3 text-sm font-bold leading-6 text-[var(--green-strong)]">
                {selectedPotSize
                  ? `서버 전송: 윗지름 ${selectedPotSize.topDiameterCm}cm, 밑지름 ${selectedPotSize.bottomDiameterCm}cm, 높이 ${selectedPotSize.heightCm}cm`
                  : "화분 호수를 선택하면 실제 cm 규격이 자동 매핑됩니다."}
              </div>
              <Field label={t.leafArea} required helper="잎 상태 대신 잎 면적 정보를 전달합니다.">
                <TextInput
                  value={draft.leafArea}
                  required
                  onChange={(event) => update("leafArea", event.target.value)}
                  placeholder={t.leafAreaPlaceholder}
                />
              </Field>
              <Field label={t.pottedStemLengthCm} required>
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
              <Field label={t.floweringStatus} required>
                <OptionSelect
                  value={draft.floweringStatus}
                  options={floweringStatusOptions}
                  onChange={(value) => update("floweringStatus", value)}
                />
              </Field>
              <Field label={t.growthCondition} required>
                <OptionSelect
                  value={draft.growthCondition}
                  options={growthConditionOptions}
                  onChange={(value) => update("growthCondition", value)}
                />
              </Field>
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

function OptionSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <SelectInput
      value={value}
      required
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </SelectInput>
  );
}
