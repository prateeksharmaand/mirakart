export type ReturnStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "AWAITING_SHIPMENT"
  | "ITEM_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface ReturnReason {
  id: string;
  label: string;
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

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  status: ReturnStatus;
  reasonDetail: string | null;
  quantity: number;
  refundAmount: string | null;
  requestedAt: string;
  reason: ReturnReason;
  images: ReturnImage[];
  statusHistory?: ReturnStatusHistoryEntry[];
}
