"use client";

import { useState } from "react";
import { buildCaptureGuide } from "@/constants/captureGuides";
import { CameraCapturePage } from "@/components/CameraCapturePage";
import { CaptureGuidePage } from "@/components/CaptureGuidePage";
import { FlowerInfoFormPage } from "@/components/FlowerInfoFormPage";
import { Header } from "@/components/Header";
import { LandingPage } from "@/components/LandingPage";
import { LoadingPage } from "@/components/LoadingPage";
import { ProductListingFormPage } from "@/components/ProductListingFormPage";
import { ProductMarketplacePage } from "@/components/ProductMarketplacePage";
import { ProductPublishCompletePage } from "@/components/ProductPublishCompletePage";
import { ProductPurchasePage } from "@/components/ProductPurchasePage";
import { ProductPurchaseCompletePage } from "@/components/ProductPurchaseCompletePage";
import { PurchaseOrderHistoryPage } from "@/components/PurchaseOrderHistoryPage";
import { ResultReportPage } from "@/components/ResultReportPage";
import { requestFlowerAnalysis } from "@/services/flowerAnalysisApi";
import type {
  AnalysisResult,
  CapturedImage,
  FlowerInfoForm,
} from "@/types/flower";
import type { ProductListing } from "@/types/productListing";
import type { PurchaseOrder } from "@/types/purchaseOrder";

type Step =
  | "landing"
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
  "분석 요청에 실패했습니다. Render 서버 또는 모델 서버 상태를 확인한 뒤 다시 시도해 주세요.";

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [form, setForm] = useState<FlowerInfoForm>(initialForm);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [publishedListing, setPublishedListing] = useState<ProductListing | null>(null);
  const [selectedListing, setSelectedListing] = useState<ProductListing | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);

  const clearAnalysisState = () => {
    setCapturedImages([]);
    setForm(initialForm);
    setResult(null);
    setErrorMessage("");
    setPublishedListing(null);
    setSelectedListing(null);
    setPurchaseOrder(null);
  };

  const startNewAnalysis = () => {
    clearAnalysisState();
    setStep("form");
  };

  const resetToLanding = () => {
    clearAnalysisState();
    setStep("landing");
  };

  const submitForm = (nextForm: FlowerInfoForm) => {
    setForm(nextForm);
    setCapturedImages([]);
    setResult(null);
    setErrorMessage("");
    setStep("guide");
  };

  const submitAnalysis = async () => {
    if (capturedImages.length === 0) return;

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
      <Header />
      {step === "landing" && (
        <LandingPage
          onStart={() => setStep("form")}
          onViewListings={() => setStep("marketplace")}
        />
      )}
      {step === "form" && (
        <FlowerInfoFormPage
          form={form}
          errorMessage={errorMessage}
          onBack={resetToLanding}
          onSubmit={submitForm}
        />
      )}
      {step === "guide" && (
        <CaptureGuidePage
          form={form}
          onBack={() => setStep("form")}
          onStartCapture={() => setStep("camera")}
        />
      )}
      {step === "camera" && (
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
      {step === "result" && result && capturedImages.length > 0 && (
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
      {step === "listing" && result && capturedImages.length > 0 && (
        <ProductListingFormPage
          result={result}
          form={form}
          capturedImages={capturedImages}
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
          onBack={resetToLanding}
          onNewAnalysis={startNewAnalysis}
          onPurchase={(listing) => {
            setSelectedListing(listing);
            setStep("purchase");
          }}
          onViewOrders={() => setStep("orders")}
        />
      )}
      {step === "purchase" && selectedListing && (
        <ProductPurchasePage
          listing={selectedListing}
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
          onViewMarketplace={() => setStep("marketplace")}
          onNewAnalysis={startNewAnalysis}
        />
      )}
    </main>
  );
}
