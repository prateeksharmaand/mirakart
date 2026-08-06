export type ReturnStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "AWAITING_SHIPMENT"
  | "ITEM_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export type ReturnResolutionType = "REFUND" | "REPLACEMENT";

export interface ReturnReason {
  id: string;
  reason: string;
}

export interface ReturnImage {
  id: string;
  media: { id: string; url: string };
}

export interface ReturnStatusHistoryEntry {
  id: string;
  status: ReturnStatus;
  note: string | null;
  changedAt: string;
}

export interface VariantAttributeValue {
  attributeValue: {
    id: string;
    value: string;
    colorHex: string | null;
    attribute: { id: string; name: string; type: string };
  };
}

/** A sibling variant of the purchased product, offered as a replacement option. */
export interface ReplacementOption {
  id: string;
  sku: string;
  price: string;
  attributeValues: VariantAttributeValue[];
  inventory: { quantity: number } | null;
}

export interface ReturnOrderItem {
  id: string;
  productNameSnapshot: string;
  variantSnapshot: {
    sku: string;
    attributes: { attributeName: string; value: string; colorHex: string | null }[];
  };
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  status: ReturnStatus;
  reasonDetail: string | null;
  quantity: number;
  refundAmount: string | null;
  resolutionType: ReturnResolutionType;
  replacementVariant: { id: string; sku: string; attributeValues: VariantAttributeValue[] } | null;
  requestedAt: string;
  reason: ReturnReason;
  images: ReturnImage[];
  statusHistory?: ReturnStatusHistoryEntry[];
  orderItem?: ReturnOrderItem;
}
