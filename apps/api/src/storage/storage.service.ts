import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { Client } from "minio";

export type StorageBucket =
  | "product-images"
  | "merchant-documents"
  | "return-images"
  | "store-assets"
  | "banners";

// Mirrors the anonymous-download policy set by the `minio-init` service in
// docker-compose.yml — these buckets serve permanent public URLs, the rest
// require a presigned, time-limited URL.
const PUBLIC_BUCKETS: ReadonlySet<StorageBucket> = new Set([
  "product-images",
  "store-assets",
  "banners",
]);

const PRESIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // MinIO's max (7 days)

@Injectable()
export class StorageService implements OnModuleInit {
  private client!: Client;
  private useSSL!: boolean;
  private endPoint!: string;
  private port!: number;
  private publicUrl!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.endPoint = this.config.get<string>("MINIO_ENDPOINT", "localhost");
    this.port = this.config.get<number>("MINIO_PORT", 9000);
    this.useSSL = this.config.get<string>("MINIO_USE_SSL", "false") === "true";
    this.client = new Client({
      endPoint: this.endPoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.config.get<string>("MINIO_ROOT_USER"),
      secretKey: this.config.get<string>("MINIO_ROOT_PASSWORD"),
    });
    // Public base URL for browser-accessible links (no trailing slash)
    const protocol = this.useSSL ? "https" : "http";
    const portSuffix =
      (this.useSSL && this.port === 443) || (!this.useSSL && this.port === 80)
        ? ""
        : `:${this.port}`;
    const defaultPublicUrl = `${protocol}://${this.endPoint}${portSuffix}`;
    this.publicUrl = (
      this.config.get<string>("MINIO_PUBLIC_URL", defaultPublicUrl) ?? defaultPublicUrl
    ).replace(/\/$/, "");
  }

  async upload(
    bucket: StorageBucket,
    originalFilename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ bucket: StorageBucket; objectKey: string; url: string }> {
    const extension = originalFilename.includes(".") ? originalFilename.split(".").pop() : undefined;
    const objectKey = extension ? `${randomUUID()}.${extension}` : randomUUID();

    await this.client.putObject(bucket, objectKey, buffer, buffer.length, {
      "Content-Type": mimeType,
    });

    return { bucket, objectKey, url: await this.getUrl(bucket, objectKey) };
  }

  async getUrl(bucket: StorageBucket, objectKey: string): Promise<string> {
    if (PUBLIC_BUCKETS.has(bucket)) {
      return `${this.publicUrl}/${bucket}/${objectKey}`;
    }
    return this.client.presignedGetObject(bucket, objectKey, PRESIGNED_URL_EXPIRY_SECONDS);
  }

  async delete(bucket: StorageBucket, objectKey: string): Promise<void> {
    await this.client.removeObject(bucket, objectKey);
  }
}
