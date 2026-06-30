import type { ProductDeliveryMethod, ProductListing } from "./productListing";

export type PurchaseOrderStatus = "requested" | "cancelled";
export type PurchasePaymentMethod = "현장 결제" | "계좌 이체" | "협의";

export type PurchaseBuyer = {
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
};

export type PurchaseOrderFields = {
  buyerName: string;
  buyerPhone: string;
  quantity: string;
  desiredDate: string;
  deliveryMethod: ProductDeliveryMethod;
  paymentMethod: PurchasePaymentMethod;
  buyerMemo: string;
};

export type PurchaseOrder = {
  schemaVersion: "florai.purchase.v1";
  orderId: string;
  status: PurchaseOrderStatus;
  storageMode: "local_demo";
  createdAt: string;
  updatedAt: string;
  buyer: PurchaseBuyer;
  seller: ProductListing["seller"];
  listingId: string;
  product: ProductListing["product"];
  item: {
    title: string;
    unitPrice: number;
    quantity: number;
    unit: ProductListing["sale"]["unit"];
    totalPrice: number;
  };
  fulfillment: {
    desiredDate: string;
    deliveryMethod: ProductDeliveryMethod;
    location: string;
  };
  payment: {
    method: PurchasePaymentMethod;
    status: "demo_pending";
  };
  image: ProductListing["image"];
  quality: ProductListing["quality"];
  memo: {
    buyerMemo: string;
  };
  source: {
    listingSnapshot: ProductListing;
  };
};

export type CreatePurchaseOrderInput = {
  listing: ProductListing;
  fields: PurchaseOrderFields;
};

export type PurchaseOrderRepository = {
  create(input: CreatePurchaseOrderInput): PurchaseOrder;
  list(): PurchaseOrder[];
  get(orderId: string): PurchaseOrder | null;
  clear(): void;
};
