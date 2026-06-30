import { productListingRepository } from "@/services/productListingRepository";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderFields,
  PurchaseOrderRepository,
} from "@/types/purchaseOrder";
import type { ProductListing } from "@/types/productListing";

const LOCAL_STORAGE_KEY = "florai:demo:purchases:v1";
const MAX_LOCAL_ORDERS = 50;

export const purchaseOrderRepository: PurchaseOrderRepository = {
  create(input) {
    const order = buildPurchaseOrder(input);
    const orders = readOrders();
    writeOrders([order, ...orders]);
    productListingRepository.decreaseQuantity(
      input.listing.listingId,
      order.item.quantity,
    );
    return order;
  },
  list() {
    return readOrders();
  },
  get(orderId) {
    return readOrders().find((item) => item.orderId === orderId) ?? null;
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  },
};

export function createPurchaseDefaults(
  listing: ProductListing,
  buyer?: CreatePurchaseOrderInput["buyer"],
): PurchaseOrderFields {
  return {
    buyerName: buyer?.name ?? "",
    buyerPhone: buyer?.phone ?? "",
    quantity: "1",
    desiredDate: listing.sale.availableFrom || new Date().toISOString().slice(0, 10),
    deliveryMethod: listing.sale.deliveryMethod,
    paymentMethod: "협의",
    buyerMemo: "",
  };
}

export function getPurchaseStorageModeLabel() {
  return "브라우저 주문 저장";
}

function buildPurchaseOrder({
  listing,
  fields,
  buyer,
}: CreatePurchaseOrderInput): PurchaseOrder {
  const now = new Date().toISOString();
  const quantity = Number(fields.quantity || 0);
  const unitPrice = listing.sale.price;
  const totalPrice = unitPrice * quantity;

  return {
    schemaVersion: "florai.purchase.v1",
    orderId: createOrderId(),
    status: "requested",
    storageMode: "local_demo",
    createdAt: now,
    updatedAt: now,
    buyer: {
      buyerId: buyer?.userId ?? "local_buyer",
      buyerName: fields.buyerName.trim() || buyer?.name || "구매자",
      buyerPhone: fields.buyerPhone.trim() || buyer?.phone || "",
    },
    seller: listing.seller,
    listingId: listing.listingId,
    product: listing.product,
    item: {
      title: listing.product.title,
      unitPrice,
      quantity,
      unit: listing.sale.unit,
      totalPrice,
    },
    fulfillment: {
      desiredDate: fields.desiredDate,
      deliveryMethod: fields.deliveryMethod,
      location: listing.sale.location,
    },
    payment: {
      method: fields.paymentMethod,
      status: "demo_pending",
    },
    quality: listing.quality,
    memo: {
      buyerMemo: fields.buyerMemo.trim(),
    },
    source: {
      listingId: listing.listingId,
      listingStorageMode: listing.storageMode,
    },
  };
}

function readOrders(): PurchaseOrder[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPurchaseOrder).map(sanitizePurchaseOrder);
  } catch {
    return [];
  }
}

function writeOrders(orders: PurchaseOrder[]) {
  if (typeof window === "undefined") return;

  const compactOrders = orders
    .filter(isPurchaseOrder)
    .map(sanitizePurchaseOrder)
    .slice(0, MAX_LOCAL_ORDERS);

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(compactOrders));
  } catch (error) {
    if (isQuotaExceededError(error)) {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(compactOrders.slice(0, 10)),
      );
      return;
    }
    throw error;
  }
}

function sanitizePurchaseOrder(order: PurchaseOrder): PurchaseOrder {
  const legacySource = order.source as
    | PurchaseOrder["source"]
    | { listingSnapshot?: ProductListing; listingId?: string; listingStorageMode?: ProductListing["storageMode"] }
    | undefined;

  const listingSnapshot = legacySource && "listingSnapshot" in legacySource
    ? legacySource.listingSnapshot
    : undefined;

  return {
    schemaVersion: "florai.purchase.v1",
    orderId: order.orderId,
    status: order.status ?? "requested",
    storageMode: "local_demo",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
    buyer: order.buyer,
    seller: order.seller,
    listingId: order.listingId,
    product: order.product,
    item: order.item,
    fulfillment: order.fulfillment,
    payment: order.payment,
    quality: order.quality,
    memo: order.memo ?? { buyerMemo: "" },
    source: {
      listingId: order.listingId,
      listingStorageMode: listingSnapshot?.storageMode ?? legacySource?.listingStorageMode ?? "local_demo",
    },
  };
}

function isPurchaseOrder(value: unknown): value is PurchaseOrder {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PurchaseOrder>;
  return (
    candidate.schemaVersion === "florai.purchase.v1" &&
    typeof candidate.orderId === "string"
  );
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.code === 22)
  );
}

function createOrderId() {
  const random = Math.random().toString(16).slice(2, 10);
  return `order_${Date.now()}_${random}`;
}
