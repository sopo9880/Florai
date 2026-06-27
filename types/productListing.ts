import type { AnalysisResult, CapturedImage, FlowerInfoForm } from "./flower";

export type ProductListingStatus = "published" | "hidden";
export type ProductSaleUnit = "묶음" | "화분" | "개" | "박스";
export type ProductDeliveryMethod = "직접 픽업" | "택배" | "협의";

export type ProductListingSeller = {
  sellerId: string;
  sellerName: string;
};

export type ProductListingSale = {
  price: number;
  quantity: number;
  unit: ProductSaleUnit;
  availableFrom: string;
  location: string;
  deliveryMethod: ProductDeliveryMethod;
};

export type ProductListingQuality = {
  condition: AnalysisResult["condition"];
  grade: AnalysisResult["grade"];
  confidence: number;
  summary: string;
  reasons: string[];
  warnings: string[];
  recommendation: string;
};

export type ProductListingImage = {
  kind: "dataUrl";
  dataUrl: string;
  filename: string;
  mimeType: string;
  view: string;
  label: string;
};

export type ProductListing = {
  schemaVersion: "florai.listing.v1";
  listingId: string;
  status: ProductListingStatus;
  storageMode: "local_demo";
  createdAt: string;
  updatedAt: string;
  seller: ProductListingSeller;
  product: {
    title: string;
    categoryType: FlowerInfoForm["categoryType"];
    categoryLabel: string;
    itemId: string;
    item: string;
    cultivarId: string;
    cultivar: string;
    cultivarClassId: string;
    cultivarClassName: string;
  };
  sale: ProductListingSale;
  quality: ProductListingQuality;
  measurements: Record<string, string>;
  image: ProductListingImage;
  images: ProductListingImage[];
  description: {
    autoDescription: string;
    sellerMemo: string;
  };
  source: {
    analysis: AnalysisResult;
    formSnapshot: FlowerInfoForm;
  };
};

export type ProductListingDraftFields = {
  title: string;
  price: string;
  quantity: string;
  unit: ProductSaleUnit;
  availableFrom: string;
  location: string;
  deliveryMethod: ProductDeliveryMethod;
  sellerMemo: string;
};

export type ProductListingSource = {
  result: AnalysisResult;
  form: FlowerInfoForm;
  capturedImages: CapturedImage[];
};

export type CreateProductListingInput = {
  source: ProductListingSource;
  fields: ProductListingDraftFields;
};

export type ProductListingRepository = {
  create(input: CreateProductListingInput): ProductListing;
  list(): ProductListing[];
  get(listingId: string): ProductListing | null;
  clear(): void;
};
