"use client";

import { useEffect, useState } from "react";
import { buildCaptureGuide } from "@/constants/captureGuides";
import { AuthPage } from "@/components/AuthPage";
import { CameraCapturePage } from "@/components/CameraCapturePage";
import { CaptureGuidePage } from "@/components/CaptureGuidePage";
import { FlowerInfoFormPage } from "@/components/FlowerInfoFormPage";
import { Header } from "@/components/Header";
import { LandingPage } from "@/components/LandingPage";
import { LoadingPage } from "@/components/LoadingPage";
import { MyPage } from "@/components/MyPage";
import { ProductListingFormPage } from "@/components/ProductListingFormPage";
import { ProductMarketplacePage } from "@/components/ProductMarketplacePage";
import { ProductPublishCompletePage } from "@/components/ProductPublishCompletePage";
import { ProductPurchasePage } from "@/components/ProductPurchasePage";
import { ProductPurchaseCompletePage } from "@/components/ProductPurchaseCompletePage";
import { PurchaseOrderHistoryPage } from "@/components/PurchaseOrderHistoryPage";
import { ResultReportPage } from "@/components/ResultReportPage";
import { SellerSidebar } from "@/components/SellerSidebar";
import { authRepository } from "@/services/authRepository";
import { requestFlowerAnalysis } from "@/services/flowerAnalysisApi";
import type { AuthUser, AuthUserRole } from "@/types/auth";
import type {
  AnalysisResult,
  CapturedImage,
  FlowerInfoForm,
} from "@/types/flower";
import type { ProductListing } from "@/types/productListing";
import type { PurchaseOrder } from "@/types/purchaseOrder";

type Step =
  | "landing"
  | "login"
  | "signup"
  | "mypage"
  | "form"
  | "guide"
  | "camera"
  | "loading"
  | "result"
  | "listing"
  | "published"
  | "marketplace"
  | "purchase"
  | "purchaseComplete"
  | "orders";

const initialForm: FlowerInfoForm = {
  categoryType: "cut_flower",
  cultivarClassId: "",
  itemId: "",
  item: "",
  cultivarId: "",
  cultivar: "",
  cultivarClassName: "",
  stemLengthCm: "",
  bundleCount: "10",
  floweringStage: "4/5 개화",
  leafArea: "",
  potSizeHo: "",
  potTopDiameterCm: "",
  potBottomDiameterCm: "",
  potHeightCm: "",
  pottedStemLengthCm: "",
  floweringStatus: "꽃 없음",
  growthCondition: "균형 양호",
  shootingPart: "줄기 포함",
  shippedAt: "",
  memo: "",
};

const analysisFailureMessage =
  "분석 요청에 실패했습니다. 서버 또는 모델 상태를 확인한 뒤 다시 시도해 주세요.";

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [authDefaultRole, setAuthDefaultRole] = useState<AuthUserRole>("buyer");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [form, setForm] = useState<FlowerInfoForm>(initialForm);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [publishedListing, setPublishedListing] = useState<ProductListing | null>(null);
  const [selectedListing, setSelectedListing] = useState<ProductListing | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCurrentUser(authRepository.getCurrentUser());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isSeller = currentUser?.role === "seller";
  const canPurchase = Boolean(currentUser);

  const clearAnalysisState = () => {
    setCapturedImages([]);
    setForm(initialForm);
    setResult(null);
    setErrorMessage("");
    setPublishedListing(null);
    setPurchaseOrder(null);
  };

  const startNewAnalysis = () => {
    if (!isSeller) {
      setAuthDefaultRole("seller");
      setStep(currentUser ? "marketplace" : "signup");
      return;
    }
    clearAnalysisState();
    setStep("form");
  };

  const resetToLanding = () => {
    clearAnalysisState();
    setSelectedListing(null);
    setStep("landing");
  };

  const openLogin = () => {
    setAuthDefaultRole("buyer");
    setStep("login");
  };

  const openSignup = (role: AuthUserRole = "buyer") => {
    setAuthDefaultRole(role);
    setStep("signup");
  };

  const authenticated = (user: AuthUser) => {
    setCurrentUser(user);
    if (selectedListing) {
      setStep("purchase");
      return;
    }
    setStep("landing");
  };

  const logout = () => {
    authRepository.logout();
    setCurrentUser(null);
    setSidebarOpen(false);
    clearAnalysisState();
    setSelectedListing(null);
    setStep("landing");
  };

  const go = (nextStep: Step) => {
    setSidebarOpen(false);
    setStep(nextStep);
  };

  const submitForm = (nextForm: FlowerInfoForm) => {
    if (!isSeller) return;
    setForm(nextForm);
    setCapturedImages([]);
    setResult(null);
    setErrorMessage("");
    setStep("guide");
  };

  const submitAnalysis = async () => {
    if (!isSeller || capturedImages.length === 0) return;

    setResult(null);
    setErrorMessage("");
    setStep("loading");

    try {
      const analysis = await requestFlowerAnalysis({
        images: capturedImages,
        captureGuide: buildCaptureGuide(form),
        ...form,
      });

      setResult(analysis);
      setStep("result");
    } catch (error) {
      console.error(error);
      setErrorMessage(analysisFailureMessage);
      setStep("camera");
    }
  };

  return (
    <main className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      <Header
        user={currentUser}
        onLogin={openLogin}
        onSignup={() => openSignup("buyer")}
        onLogout={logout}
        onMyPage={() => go(currentUser ? "mypage" : "login")}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onHome={resetToLanding}
      />

      {currentUser?.role === "seller" && (
        <SellerSidebar
          user={currentUser}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onHome={() => go("landing")}
          onAnalyze={startNewAnalysis}
          onMarketplace={() => go("marketplace")}
          onOrders={() => go("orders")}
          onMyPage={() => go("mypage")}
          onLogout={logout}
        />
      )}

      {step === "landing" && (
        <LandingPage
          user={currentUser}
          onStart={startNewAnalysis}
          onViewListings={() => setStep("marketplace")}
          onViewOrders={() => setStep(currentUser ? "orders" : "login")}
          onLogin={openLogin}
          onBuyerSignup={() => openSignup("buyer")}
          onSellerSignup={() => openSignup("seller")}
        />
      )}

      {(step === "login" || step === "signup") && (
        <AuthPage
          mode={step}
          defaultRole={authDefaultRole}
          onModeChange={(mode) => setStep(mode)}
          onAuthenticated={authenticated}
          onBack={resetToLanding}
        />
      )}

      {step === "mypage" && currentUser && (
        <MyPage
          user={currentUser}
          onBack={resetToLanding}
          onAnalyze={startNewAnalysis}
          onMarketplace={() => setStep("marketplace")}
          onOrders={() => setStep("orders")}
          onLogout={logout}
        />
      )}

      {step === "form" && isSeller && (
        <FlowerInfoFormPage
          form={form}
          errorMessage={errorMessage}
          onBack={resetToLanding}
          onSubmit={submitForm}
        />
      )}
      {step === "guide" && isSeller && (
        <CaptureGuidePage
          form={form}
          onBack={() => setStep("form")}
          onStartCapture={() => setStep("camera")}
        />
      )}
      {step === "camera" && isSeller && (
        <CameraCapturePage
          form={form}
          capturedImages={capturedImages}
          onImagesChange={(images) => {
            setErrorMessage("");
            setCapturedImages(images);
          }}
          onBack={() => setStep("guide")}
          onNext={submitAnalysis}
        />
      )}
      {step === "loading" && <LoadingPage />}
      {step === "result" && isSeller && result && capturedImages.length > 0 && (
        <ResultReportPage
          result={result}
          form={form}
          capturedImages={capturedImages}
          onRetake={() => {
            setCapturedImages([]);
            setResult(null);
            setErrorMessage("");
            setStep("camera");
          }}
          onRestart={startNewAnalysis}
          onPublish={() => setStep("listing")}
        />
      )}
      {step === "listing" && isSeller && result && capturedImages.length > 0 && (
        <ProductListingFormPage
          result={result}
          form={form}
          capturedImages={capturedImages}
          seller={currentUser}
          onBack={() => setStep("result")}
          onPublished={(listing) => {
            setPublishedListing(listing);
            setStep("published");
          }}
          onViewListings={() => setStep("marketplace")}
        />
      )}
      {step === "published" && publishedListing && (
        <ProductPublishCompletePage
          listing={publishedListing}
          onNewAnalysis={startNewAnalysis}
          onViewMarketplace={() => setStep("marketplace")}
        />
      )}
      {step === "marketplace" && (
        <ProductMarketplacePage
          canAnalyze={isSeller}
          canPurchase={canPurchase}
          currentUser={currentUser}
          onBack={resetToLanding}
          onNewAnalysis={startNewAnalysis}
          onPurchase={(listing) => {
            if (currentUser?.userId === listing.seller.sellerId) {
              return;
            }
            setSelectedListing(listing);
            setStep("purchase");
          }}
          onViewOrders={() => setStep(currentUser ? "orders" : "login")}
          onLoginRequired={() => {
            setAuthDefaultRole("buyer");
            setStep("login");
          }}
        />
      )}
      {step === "purchase" && selectedListing && currentUser && (
        <ProductPurchasePage
          listing={selectedListing}
          buyer={currentUser}
          onBack={() => setStep("marketplace")}
          onPurchased={(order) => {
            setPurchaseOrder(order);
            setStep("purchaseComplete");
          }}
          onViewOrders={() => setStep("orders")}
        />
      )}
      {step === "purchaseComplete" && purchaseOrder && (
        <ProductPurchaseCompletePage
          order={purchaseOrder}
          onViewMarketplace={() => setStep("marketplace")}
          onViewOrders={() => setStep("orders")}
        />
      )}
      {step === "orders" && (
        <PurchaseOrderHistoryPage
          user={currentUser}
          canAnalyze={isSeller}
          onViewMarketplace={() => setStep("marketplace")}
          onNewAnalysis={startNewAnalysis}
        />
      )}
    </main>
  );
}
