import { getCategoryLabel } from "@/constants/flowerTaxonomy";
import type { FlowerInfoForm } from "@/types/flower";
import type {
  CreateProductListingInput,
  ProductListing,
  ProductListingDraftFields,
  ProductListingRepository,
  ProductListingSource,
  ProductSaleUnit,
} from "@/types/productListing";

const LOCAL_STORAGE_KEY = "florai:demo:listings:v1";
const DEMO_SELLER = {
  sellerId: "demo_seller",
  sellerName: "데모 판매자",
};

export const productListingRepository: ProductListingRepository = {
  create(input) {
    const listing = buildProductListing(input);
    const listings = readListings();
    writeListings([
      listing,
      ...listings.filter((item) => item.listingId !== listing.listingId),
    ]);
    return listing;
  },
  list() {
    return readListings();
  },
  get(listingId) {
    return readListings().find((item) => item.listingId === listingId) ?? null;
  },
  decreaseQuantity(listingId, quantity) {
    const listings = readListings();
    const nextListings = listings.map((listing) => {
      if (listing.listingId !== listingId) return listing;
      const nextQuantity = Math.max(0, listing.sale.quantity - quantity);
      return {
        ...listing,
        status: nextQuantity <= 0 ? "hidden" : listing.status,
        updatedAt: new Date().toISOString(),
        sale: {
          ...listing.sale,
          quantity: nextQuantity,
        },
      };
    });
    writeListings(nextListings);
    return nextListings.find((item) => item.listingId === listingId) ?? null;
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  },
};

export function createProductListingDefaults(
  source: ProductListingSource,
): ProductListingDraftFields {
  const unit = getDefaultUnit(source.form.categoryType);
  return {
    title: createDefaultTitle(source.form, source.result.grade),
    price: "",
    quantity: "1",
    unit,
    availableFrom: new Date().toISOString().slice(0, 10),
    location: "",
    deliveryMethod: "협의",
    sellerMemo: "",
  };
}

export function createDefaultTitle(form: FlowerInfoForm, grade: string) {
  const className =
    form.cultivarClassName ||
    [form.item, form.cultivar].filter(Boolean).join(" ");
  const gradeText = grade && grade !== "비정상" ? `${grade} 등급` : "품질 확인";

  if (form.categoryType === "potted_plant") {
    const pot = form.potSizeHo ? `${form.potSizeHo}호` : "분화";
    return `${className || "화훼류"} ${pot} ${gradeText}`;
  }

  const bundle = form.bundleCount ? `${form.bundleCount}본` : "절화";
  return `${className || "화훼류"} ${bundle} ${gradeText}`;
}

export function getListingStorageModeLabel() {
  return "localStorage 데모 저장";
}

export function getDefaultUnit(
  categoryType: FlowerInfoForm["categoryType"],
): ProductSaleUnit {
  return categoryType === "potted_plant" ? "화분" : "묶음";
}

function buildProductListing({
  source,
  fields,
}: CreateProductListingInput): ProductListing {
  const now = new Date().toISOString();
  const title =
    fields.title.trim() || createDefaultTitle(source.form, source.result.grade);
  const price = Number(fields.price || 0);
  const quantity = Number(fields.quantity || 0);
  const images = source.capturedImages.map(toListingImage);
  const primaryImage = images[0] ?? createEmptyListingImage();

  return {
    schemaVersion: "florai.listing.v1",
    listingId: createListingId(),
    status: "published",
    storageMode: "local_demo",
    createdAt: now,
    updatedAt: now,
    seller: DEMO_SELLER,
    product: {
      title,
      categoryType: source.form.categoryType,
      categoryLabel: getCategoryLabel(source.form.categoryType),
      itemId: source.form.itemId,
      item: source.form.item,
      cultivarId: source.form.cultivarId,
      cultivar: source.form.cultivar,
      cultivarClassId: source.form.cultivarClassId,
      cultivarClassName: source.form.cultivarClassName,
    },
    sale: {
      price,
      quantity,
      unit: fields.unit,
      availableFrom: fields.availableFrom,
      location: fields.location.trim(),
      deliveryMethod: fields.deliveryMethod,
    },
    quality: {
      condition: source.result.condition,
      grade: source.result.grade,
      confidence: source.result.confidence,
      summary: source.result.summary,
      reasons: source.result.reasons,
      warnings: source.result.warnings,
      recommendation: source.result.recommendation,
    },
    measurements: createMeasurementSnapshot(source.form),
    image: primaryImage,
    images,
    description: {
      autoDescription: createAutoDescription(source.form, source.result),
      sellerMemo: fields.sellerMemo.trim(),
    },
    source: {
      analysis: source.result,
      formSnapshot: source.form,
    },
  };
}

function readListings(): ProductListing[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isProductListing);
  } catch {
    return [];
  }
}

function writeListings(listings: ProductListing[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listings));
}

function isProductListing(value: unknown): value is ProductListing {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProductListing>;
  return (
    candidate.schemaVersion === "florai.listing.v1" &&
    typeof candidate.listingId === "string"
  );
}

function createListingId() {
  const random = Math.random().toString(16).slice(2, 10);
  return `listing_${Date.now()}_${random}`;
}

function toListingImage(
  capturedImage: ProductListingSource["capturedImages"][number],
) {
  return {
    kind: "dataUrl" as const,
    dataUrl: capturedImage.dataUrl,
    filename: capturedImage.file?.name || `florai-${capturedImage.view}.jpg`,
    mimeType: getMimeType(capturedImage),
    view: capturedImage.view,
    label: capturedImage.label,
  };
}

function createEmptyListingImage() {
  return {
    kind: "dataUrl" as const,
    dataUrl: "",
    filename: "florai-listing-image.jpg",
    mimeType: "image/jpeg",
    view: "front_full",
    label: "대표 사진",
  };
}

function getMimeType(
  capturedImage: ProductListingSource["capturedImages"][number],
) {
  if (capturedImage.file?.type) return capturedImage.file.type;
  return capturedImage.dataUrl.match(/^data:([^;]+)/)?.[1] || "image/jpeg";
}

function createMeasurementSnapshot(
  form: FlowerInfoForm,
): Record<string, string> {
  if (form.categoryType === "potted_plant") {
    return {
      potSizeHo: form.potSizeHo,
      potTopDiameterCm: form.potTopDiameterCm,
      potBottomDiameterCm: form.potBottomDiameterCm,
      potHeightCm: form.potHeightCm,
      leafArea: form.leafArea,
      pottedStemLengthCm: form.pottedStemLengthCm,
      floweringStatus: form.floweringStatus,
      growthCondition: form.growthCondition,
    };
  }

  return {
    stemLengthCm: form.stemLengthCm,
    bundleCount: form.bundleCount,
    floweringStage: form.floweringStage,
    leafArea: form.leafArea,
  };
}

function createAutoDescription(
  form: FlowerInfoForm,
  result: ProductListingSource["result"],
) {
  const className =
    form.cultivarClassName ||
    [form.item, form.cultivar].filter(Boolean).join(" ");
  const base = `${className || "화훼류"} 상품입니다.`;
  const quality = `AI 품질 분석 결과 ${result.condition === "normal" ? "정상" : "비정상 확인 필요"} 상태로 판단되었고, 등급 후보는 ${result.grade}입니다.`;
  const caution = "실제 판매 전 실물 상태와 수량을 한 번 더 확인해 주세요.";
  return `${base} ${quality} ${caution}`;
}
