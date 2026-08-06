import { apiClient } from "../api-client";

export type OrderStatus =
  | "PENDING"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "ACCEPTED"
  | "PROCESSING"
  | "PACKED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED_DELIVERY"
  | "COD_REFUSED";

export type FulfillmentStatus = "PROCESSING" | "PACKED" | "READY_TO_SHIP" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";

export type DispatchMethod = "COURIER" | "SELF_DELIVERY";

export const COURIER_PARTNERS = [
  "Delhivery",
  "DTDC",
  "Blue Dart",
  "XpressBees",
  "Ecom Express",
  "India Post",
  "Shadowfax",
  "Other",
] as const;

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  changedAt: string;
  changedByType?: string | null;
}

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  statusHistory?: OrderStatusHistoryEntry[];
  payment?: { method: "COD" | "ONLINE"; status: string } | null;
  customer?: { id: string; firstName: string; lastName: string; email: string; phone: string } | null;
  shippingAddress?: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items?: Array<{
    id: string;
    productNameSnapshot: string;
    variantSnapshot: { sku: string; attributes: { attributeName: string; value: string }[] };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: OrderStatus;
    merchantId: string;
    product?: {
      productCode: string;
      brand: { name: string } | null;
      category: { name: string } | null;
      images: { media: { url: string } }[];
    } | null;
    dispatchMethod: DispatchMethod | null;
    courierPartner: string | null;
    customCourierName: string | null;
    trackingNumber: string | null;
    deliveryPersonName: string | null;
    deliveryPersonPhone: string | null;
    vehicleNumber: string | null;
    dispatchDate: string | null;
    expectedDeliveryDate: string | null;
    deliveredAt: string | null;
    shipmentNotes: string | null;
  }>;
}

export async function listMerchantOrders(
  params: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: "asc" | "desc"; search?: string } = {},
) {
  const res = await apiClient.get("/merchants/me/orders", { params });
  return res.data as { data: MerchantOrder[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getMerchantOrder(id: string): Promise<MerchantOrder> {
  const res = await apiClient.get(`/merchants/me/orders/${id}`);
  return res.data.data as MerchantOrder;
}

export async function updateOrderItemStatus(orderId: string, itemId: string, status: string): Promise<void> {
  await apiClient.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
}

export async function acceptOrder(id: string): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/accept`);
  return res.data.data as MerchantOrder;
}

export async function rejectOrder(id: string, reason: string): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/reject`, { reason });
  return res.data.data as MerchantOrder;
}

export async function updateFulfillmentStatus(id: string, status: FulfillmentStatus): Promise<MerchantOrder> {
  const res = await apiClient.patch(`/merchants/me/orders/${id}/fulfillment-status`, { status });
  return res.data.data as MerchantOrder;
}

export interface DispatchOrderInput {
  dispatchMethod: DispatchMethod;
  courierPartner?: string;
  customCourierName?: string;
  trackingNumber?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  vehicleNumber?: string;
  expectedDeliveryDate?: string;
  shipmentNotes?: string;
}

export async function dispatchOrder(id: string, input: DispatchOrderInput): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/dispatch`, input);
  return res.data.data as MerchantOrder;
}

export interface UpdateShipmentInput {
  trackingNumber?: string;
  courierPartner?: string;
  expectedDeliveryDate?: string;
}

export async function updateShipment(id: string, input: UpdateShipmentInput): Promise<MerchantOrder> {
  const res = await apiClient.patch(`/merchants/me/orders/${id}/shipment`, input);
  return res.data.data as MerchantOrder;
}

export async function completeOrder(id: string): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/complete`);
  return res.data.data as MerchantOrder;
}

export async function markCodRefused(id: string, reason: string): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/mark-cod-refused`, { reason });
  return res.data.data as MerchantOrder;
}

export interface MarkCodReceivedInput {
  amountReceived: number;
  receivedDate: string;
  remarks?: string;
}

export async function markCodReceived(id: string, input: MarkCodReceivedInput): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/mark-cod-received`, input);
  return res.data.data as MerchantOrder;
}

export async function cancelOrder(id: string, reason?: string): Promise<MerchantOrder> {
  const res = await apiClient.post(`/merchants/me/orders/${id}/cancel`, { reason });
  return res.data.data as MerchantOrder;
}
