import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  headline: "표준규격 기반 화훼 품질 판별 보조 시스템.",
  description:
    "대기준·품목·품종 정보를 먼저 입력하고, 선택한 식물 유형에 맞는 촬영 가이드에 따라 이미지를 전달하면 Florai가 정상/비정상 여부와 등급 후보를 설명합니다.",
  start: "식물 정보 입력하기",
  marketplace: "데모 상품 목록 보기",
  heroAlt: "스마트폰으로 화훼 상태를 촬영하는 작업대",
  reportReady: "Render 서버 연동 준비",
  flow: "정보 입력 → 이미지 분석 → 근거 리포트 → 상품 게시",
  comingSoon:
    "지원 구조: 절화류/분화류 분기, 화분 호수 규격 매핑, 표준규격 RAG 근거 생성용 payload",
};

type LandingPageProps = {
  onStart: () => void;
  onViewListings: () => void;
};

export function LandingPage({ onStart, onViewListings }: LandingPageProps) {
  return (
    <section className="florai-shell grid min-h-[calc(100svh-4rem)] items-center gap-8 py-8 md:grid-cols-[1fr_0.92fr] md:py-14">
      <div className="order-2 space-y-7 md:order-1">
        <div className="space-y-4">
          <p className="text-sm font-extrabold text-[var(--green-strong)]">
            Flora + AI
          </p>
          <h1 className="text-5xl font-black leading-[1.02] text-[var(--ink)] sm:text-6xl">
            Florai
          </h1>
          <p className="text-2xl font-black leading-tight text-[var(--ink)] sm:text-3xl">
            {t.headline}
          </p>
          <p className="max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            {t.description}
          </p>
        </div>

        <div className="space-y-3 sm:max-w-md">
          <div className="grid gap-3 sm:grid-cols-2">
            <PrimaryButton onClick={onStart}>{t.start}</PrimaryButton>
            <SecondaryButton onClick={onViewListings}>{t.marketplace}</SecondaryButton>
          </div>
          <p className="rounded-lg border border-[var(--line)] bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-[var(--muted)]">
            {t.comingSoon}
          </p>
        </div>
      </div>

      <div className="order-1 md:order-2">
        <div className="relative overflow-hidden rounded-lg border border-white bg-white shadow-[var(--shadow)]">
          <img
            src="/florai-hero.png"
            alt={t.heroAlt}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-[rgba(255,255,255,0.88)] p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black">{t.reportReady}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  {t.flow}
                </p>
              </div>
              <div className="rounded-full bg-[var(--green)] px-3 py-2 text-sm font-black text-[var(--green-strong)]">
                AI
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
