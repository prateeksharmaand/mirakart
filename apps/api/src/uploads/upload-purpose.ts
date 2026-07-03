import type { ActorType } from "@prisma/client";
import type { StorageBucket } from "../storage/storage.service";

export const UploadPurpose = {
  PRODUCT_IMAGES: "PRODUCT_IMAGES",
  MERCHANT_DOCUMENTS: "MERCHANT_DOCUMENTS",
  RETURN_IMAGES: "RETURN_IMAGES",
  STORE_ASSETS: "STORE_ASSETS",
  BANNERS: "BANNERS",
} as const;
export type UploadPurpose = (typeof UploadPurpose)[keyof typeof UploadPurpose];

interface PurposeConfig {
  bucket: StorageBucket;
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  allowedPrincipalTypes: ActorType[];
}

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const UPLOAD_PURPOSE_CONFIG: Record<UploadPurpose, PurposeConfig> = {
  PRODUCT_IMAGES: {
    bucket: "product-images",
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedPrincipalTypes: ["MERCHANT", "ADMIN"],
  },
  MERCHANT_DOCUMENTS: {
    bucket: "merchant-documents",
    allowedMimeTypes: [...IMAGE_MIME_TYPES, "application/pdf"],
    maxSizeBytes: 10 * 1024 * 1024,
    allowedPrincipalTypes: ["MERCHANT"],
  },
  RETURN_IMAGES: {
    bucket: "return-images",
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedPrincipalTypes: ["CUSTOMER"],
  },
  STORE_ASSETS: {
    bucket: "store-assets",
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSizeBytes: 3 * 1024 * 1024,
    allowedPrincipalTypes: ["MERCHANT"],
  },
  BANNERS: {
    bucket: "banners",
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedPrincipalTypes: ["ADMIN"],
  },
};
