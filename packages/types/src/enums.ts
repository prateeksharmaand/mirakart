/**
 * Mirrors the enums defined in apps/api/prisma/schema.prisma.
 * Kept as a hand-maintained, framework-agnostic source so non-Node
 * consumers (and the Flutter app's codegen) have a single reference.
 * Any change here must be made in schema.prisma in the same commit.
 */

export const AdminStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type AdminStatus = (typeof AdminStatus)[keyof typeof AdminStatus];

export const PermissionAction = {
  VIEW: "VIEW",
  CREATE: "CREATE",
  EDIT: "EDIT",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  EXPORT: "EXPORT",
} as const;
export type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction];

export const MerchantStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;
export type MerchantStatus = (typeof MerchantStatus)[keyof typeof MerchantStatus];

export const MerchantDocumentType = {
  BUSINESS_LICENSE: "BUSINESS_LICENSE",
  TAX_CERTIFICATE: "TAX_CERTIFICATE",
  ID_PROOF: "ID_PROOF",
  BANK_DETAILS: "BANK_DETAILS",
  OTHER: "OTHER",
} as const;
export type MerchantDocumentType = (typeof MerchantDocumentType)[keyof typeof MerchantDocumentType];

export const MerchantDocumentStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type MerchantDocumentStatus = (typeof MerchantDocumentStatus)[keyof typeof MerchantDocumentStatus];

export const CustomerStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const AddressType = {
  SHIPPING: "SHIPPING",
  BILLING: "BILLING",
  BOTH: "BOTH",
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

export const ProductStatus = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const AttributeType = {
  SELECT: "SELECT",
  COLOR: "COLOR",
  TEXT: "TEXT",
} as const;
export type AttributeType = (typeof AttributeType)[keyof typeof AttributeType];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderItemStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
} as const;
export type OrderItemStatus = (typeof OrderItemStatus)[keyof typeof OrderItemStatus];

export const PaymentMethod = {
  CARD: "CARD",
  UPI: "UPI",
  NETBANKING: "NETBANKING",
  WALLET: "WALLET",
  COD: "COD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ReturnStatus = {
  REQUESTED: "REQUESTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  AWAITING_SHIPMENT: "AWAITING_SHIPMENT",
  ITEM_RECEIVED: "ITEM_RECEIVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

export const ActorType = {
  ADMIN: "ADMIN",
  MERCHANT: "MERCHANT",
  CUSTOMER: "CUSTOMER",
  SYSTEM: "SYSTEM",
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

export const NotificationRecipientType = {
  CUSTOMER: "CUSTOMER",
  MERCHANT: "MERCHANT",
  ADMIN: "ADMIN",
} as const;
export type NotificationRecipientType = (typeof NotificationRecipientType)[keyof typeof NotificationRecipientType];

export const BannerPosition = {
  HOME_HERO: "HOME_HERO",
  HOME_SECONDARY: "HOME_SECONDARY",
  CATEGORY_TOP: "CATEGORY_TOP",
  STOREFRONT_TOP: "STOREFRONT_TOP",
} as const;
export type BannerPosition = (typeof BannerPosition)[keyof typeof BannerPosition];
