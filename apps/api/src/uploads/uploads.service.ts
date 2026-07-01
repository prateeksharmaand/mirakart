import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MediaRepository } from "../storage/media.repository";
import { StorageService, type StorageBucket } from "../storage/storage.service";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { UPLOAD_PURPOSE_CONFIG, type UploadPurpose } from "./upload-purpose";

type UploadedFile = Pick<Express.Multer.File, "originalname" | "mimetype" | "size" | "buffer">;

@Injectable()
export class UploadsService {
  constructor(
    private readonly storage: StorageService,
    private readonly media: MediaRepository,
  ) {}

  async upload(purpose: UploadPurpose, file: UploadedFile | undefined, principal: AuthenticatedPrincipal) {
    if (!file) throw new BadRequestException("No file provided");

    const config = UPLOAD_PURPOSE_CONFIG[purpose];
    if (!config.allowedPrincipalTypes.includes(principal.type)) {
      throw new ForbiddenException(`Your account type cannot upload for purpose "${purpose}"`);
    }
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: ${config.allowedMimeTypes.join(", ")}`,
      );
    }
    if (file.size > config.maxSizeBytes) {
      throw new BadRequestException(`File exceeds the ${config.maxSizeBytes / (1024 * 1024)}MB limit`);
    }

    const uploaded = await this.storage.upload(config.bucket, file.originalname, file.buffer, file.mimetype);

    return this.media.create({
      bucket: uploaded.bucket,
      objectKey: uploaded.objectKey,
      url: uploaded.url,
      mimeType: file.mimetype,
      size: file.size,
      uploadedByType: principal.type,
      uploadedById: principal.id,
    });
  }

  async remove(mediaId: string, principal: AuthenticatedPrincipal): Promise<void> {
    const media = await this.media.findById(mediaId);
    if (!media) throw new NotFoundException("File not found");

    const isOwner = media.uploadedByType === principal.type && media.uploadedById === principal.id;
    if (!isOwner && principal.type !== "ADMIN") {
      throw new ForbiddenException("You can only delete files you uploaded");
    }

    await this.storage.delete(media.bucket as StorageBucket, media.objectKey);
    await this.media.delete(mediaId);
  }
}
