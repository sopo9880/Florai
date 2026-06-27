import type { AnalysisResult } from "@/types/flower";

type GradeCardProps = {
  condition: AnalysisResult["condition"];
  grade: AnalysisResult["grade"];
  confidence: AnalysisResult["confidence"];
};

const gradeStyles = {
  특: {
    label: "특 등급",
    tone: "from-[#e7f7ed] to-[#fff7f2]",
    text: "text-[var(--green-strong)]",
    chip: "상위 규격 후보",
  },
  상: {
    label: "상 등급",
    tone: "from-[#f0fae9] to-[#fff7f2]",
    text: "text-[var(--green-strong)]",
    chip: "판매 적합",
  },
  보통: {
    label: "보통 등급",
    tone: "from-[#fff5d9] to-[#fff0ee]",
    text: "text-[#9a6a19]",
    chip: "추가 확인 권장",
  },
  비정상: {
    label: "비정상 의심",
    tone: "from-[#ffe9e9] to-[#fff8f2]",
    text: "text-[#a74848]",
    chip: "이상 부위 확인",
  },
};

export function GradeCard({ condition, grade, confidence }: GradeCardProps) {
  const style = gradeStyles[grade];

  return (
    <article
      className={`rounded-lg bg-gradient-to-br ${style.tone} p-6 shadow-[var(--shadow)]`}
    >
      <p className="text-sm font-black text-[var(--muted)]">
        {condition === "normal" ? "정상 판정 결과" : "이상 의심 결과"}
      </p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className={`text-5xl font-black leading-none ${style.text}`}>
            {grade}
          </p>
          <p className="mt-2 text-2xl font-black">{style.label}</p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--ink)]">
          {style.chip}
        </span>
      </div>
      <div className="mt-5 rounded-lg bg-white/70 p-4">
        <div className="flex items-center justify-between gap-4 text-sm font-black">
          <span className="text-[var(--muted)]">판정 신뢰도</span>
          <span>{Math.round(confidence)}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[var(--green-strong)]"
            style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%` }}
          />
        </div>
      </div>
    </article>
  );
}
