import type { AuthUser } from "@/types/auth";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const t = {
  headline: "표준규격 기반 화훼 품질 판별 보조 시스템.",
  description:
    "품목과 품종 정보를 입력하고 촬영 가이드에 따라 이미지를 전달하면 Florai가 정상/비정상 여부와 등급 후보를 설명합니다.",
  sellerStart: "AI 품질 분석 시작하기",
  buyerMarketplace: "상품 둘러보기",
  orders: "구매 내역 보기",
  sellerSignup: "판매자 회원가입",
  buyerSignup: "구매자 회원가입",
  login: "로그인하기",
  heroAlt: "스마트폰으로 화훼 상태를 촬영하는 작업대",
};

type LandingPageProps = {
  user: AuthUser | null;
  onStart: () => void;
  onViewListings: () => void;
  onViewOrders: () => void;
  onLogin: () => void;
  onBuyerSignup: () => void;
  onSellerSignup: () => void;
};

export function LandingPage({
  user,
  onStart,
  onViewListings,
  onViewOrders,
  onLogin,
  onBuyerSignup,
  onSellerSignup,
}: LandingPageProps) {
  const isSeller = user?.role === "seller";

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
          {user ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {isSeller && <PrimaryButton onClick={onStart}>{t.sellerStart}</PrimaryButton>}
              <SecondaryButton onClick={onViewListings}>{t.buyerMarketplace}</SecondaryButton>
              {!isSeller && <PrimaryButton onClick={onViewOrders}>{t.orders}</PrimaryButton>}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <PrimaryButton onClick={onSellerSignup}>{t.sellerSignup}</PrimaryButton>
              <SecondaryButton onClick={onBuyerSignup}>{t.buyerSignup}</SecondaryButton>
              <button
                type="button"
                onClick={onLogin}
                className="sm:col-span-2 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-black text-[var(--green-strong)] transition hover:border-[var(--green)] hover:bg-[#f7fbf5]"
              >
                {t.login}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="order-1 md:order-2">
        <div className="relative overflow-hidden rounded-lg border border-white bg-white shadow-[var(--shadow)]">
          <img
            src="/florai-hero.png"
            alt={t.heroAlt}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
