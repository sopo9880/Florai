import { productListingRepository } from "@/services/productListingRepository";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderFields,
  PurchaseOrderRepository,
} from "@/types/purchaseOrder";
import type { ProductListing } from "@/types/productListing";

const LOCAL_STORAGE_KEY = "florai:demo:purchases:v1";
const DEMO_BUYER_ID = "demo_buyer";

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
): PurchaseOrderFields {
  return {
    buyerName: "",
    buyerPhone: "",
    quantity: "1",
    desiredDate: listing.sale.availableFrom || new Date().toISOString().slice(0, 10),
    deliveryMethod: listing.sale.deliveryMethod,
    paymentMethod: "협의",
    buyerMemo: "",
  };
}

export function getPurchaseStorageModeLabel() {
  return "localStorage 데모 주문 저장";
}

function buildPurchaseOrder({
  listing,
  fields,
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
      buyerId: DEMO_BUYER_ID,
      buyerName: fields.buyerName.trim(),
      buyerPhone: fields.buyerPhone.trim(),
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
    image: listing.image,
    quality: listing.quality,
    memo: {
      buyerMemo: fields.buyerMemo.trim(),
    },
    source: {
      listingSnapshot: listing,
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
    return parsed.filter(isPurchaseOrder);
  } catch {
    return [];
  }
}

function writeOrders(orders: PurchaseOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
}

function isPurchaseOrder(value: unknown): value is PurchaseOrder {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PurchaseOrder>;
  return (
    candidate.schemaVersion === "florai.purchase.v1" &&
    typeof candidate.orderId === "string"
  );
}

function createOrderId() {
  const random = Math.random().toString(16).slice(2, 10);
  return `order_${Date.now()}_${random}`;
}
