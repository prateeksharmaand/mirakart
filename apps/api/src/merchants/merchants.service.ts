import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { MerchantsRepository } from "./merchants.repository";
import type { CreateMerchantDocumentDto } from "./dto/create-merchant-document.dto";
import type { MerchantQueryDto } from "./dto/merchant-query.dto";
import type { ReviewDocumentDto } from "./dto/review-document.dto";
import type { UpdateMerchantProfileDto } from "./dto/update-merchant-profile.dto";

@Injectable()
export class MerchantsService {
  constructor(
    private readonly repo: MerchantsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: MerchantQueryDto) {
    const { items, totalItems } = await this.repo.findMany({
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
      },
    };
  }

  async findOne(id: string) {
    const merchant = await this.repo.findById(id);
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant;
  }

  async updateProfile(id: string, dto: UpdateMerchantProfileDto) {
    await this.findOne(id);
    return this.repo.updateProfile(id, dto);
  }

  async approve(id: string, adminId: string) {
    const merchant = await this.findOne(id);
    if (merchant.status === "APPROVED") {
      throw new ConflictException("Merchant is already approved");
    }
    if (merchant.status === "SUSPENDED") {
      throw new BadRequestException("Reinstate a suspended merchant via a status change, not approve");
    }
    const updated = await this.repo.setStatus(id, {
      status: "APPROVED",
      approvedById: adminId,
      approvedAt: new Date(),
      rejectionReason: null,
    });
    void this.notifications.create(
      "MERCHANT", id,
      "MERCHANT_APPROVED",
      "Your store is approved 🎉",
      "Congratulations! Your store has been approved. You can now start listing products.",
    );
    return updated;
  }

  async reject(id: string, adminId: string, rejectionReason: string) {
    const merchant = await this.findOne(id);
    if (merchant.status !== "PENDING") {
      throw new BadRequestException("Only a pending merchant application can be rejected");
    }
    const updated = await this.repo.setStatus(id, { status: "REJECTED", approvedById: adminId, rejectionReason });
    void this.notifications.create(
      "MERCHANT", id,
      "MERCHANT_REJECTED",
      "Store application not approved",
      `Your store application was not approved. Reason: ${rejectionReason}`,
    );
    return updated;
  }

  async suspend(id: string) {
    const merchant = await this.findOne(id);
    if (merchant.status !== "APPROVED") {
      throw new BadRequestException("Only an approved merchant can be suspended");
    }
    return this.repo.setStatus(id, { status: "SUSPENDED" });
  }

  async addDocument(merchantId: string, dto: CreateMerchantDocumentDto) {
    await this.findOne(merchantId);
    return this.repo.createDocument({ merchantId, mediaId: dto.mediaId, type: dto.type });
  }

  async listDocuments(merchantId: string) {
    await this.findOne(merchantId);
    return this.repo.findDocuments(merchantId);
  }

  async reviewDocument(documentId: string, dto: ReviewDocumentDto) {
    const document = await this.repo.findDocumentById(documentId);
    if (!document) throw new NotFoundException("Document not found");
    return this.repo.updateDocumentStatus(documentId, dto.status);
  }
}
