import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { InsufficientReplacementStockError, ReturnsRepository } from "./returns.repository";
import type { AdminReturnQueryDto } from "./dto/admin-return-query.dto";
import type { AdminUpdateReturnStatusDto } from "./dto/admin-update-return-status.dto";
import type { CreateReturnDto } from "./dto/create-return.dto";
import type { MerchantReturnQueryDto } from "./dto/merchant-return-query.dto";
import type { MerchantUpdateReturnStatusDto } from "./dto/merchant-update-return-status.dto";
import { generateReturnNumber } from "./utils/return-number.util";

const RETURN_NUMBER_RETRY_ATTEMPTS = 3;
const MERCHANT_DECIDABLE_STATUSES = ["REQUESTED", "UNDER_REVIEW"];
const CUSTOMER_CANCELLABLE_STATUSES = ["REQUESTED", "UNDER_REVIEW"];

type ReturnDetail = NonNullable<Awaited<ReturnType<ReturnsRepository["findById"]>>>;

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

@Injectable()
export class ReturnsService {
  constructor(
    private readonly repo: ReturnsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  listReasons() {
    return this.repo.findActiveReasons();
  }

  async create(customerId: string, dto: CreateReturnDto) {
    const orderItem = await this.repo.findOrderItemForReturn(dto.orderItemId, customerId);
    if (!orderItem) throw new NotFoundException("Order item not found");
    if (orderItem.status !== "DELIVERED") {
      throw new BadRequestException("Only delivered items can be returned");
    }
    if (dto.quantity > orderItem.quantity) {
      throw new BadRequestException("Return quantity exceeds the purchased quantity");
    }
    const activeCount = await this.repo.countActiveReturnsForItem(dto.orderItemId);
    if (activeCount > 0) {
      throw new ConflictException("A return is already in progress for this item");
    }

    const resolutionType = dto.resolutionType ?? "REFUND";
    if (resolutionType === "REPLACEMENT") {
      if (!dto.replacementVariantId) {
        throw new BadRequestException("replacementVariantId is required for a replacement request");
      }
      const replacementVariant = await this.repo.findVariantById(dto.replacementVariantId);
      if (!replacementVariant) throw new NotFoundException("Replacement variant not found");
      if (replacementVariant.productId !== orderItem.variant.productId) {
        throw new BadRequestException("Replacement must be a variant of the same product");
      }
    }

    for (let attempt = 1; attempt <= RETURN_NUMBER_RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.repo.create({
          returnNumber: generateReturnNumber(),
          orderId: orderItem.orderId,
          orderItemId: dto.orderItemId,
          customerId,
          merchantId: orderItem.merchantId,
          reasonId: dto.reasonId,
          reasonDetail: dto.reasonDetail,
          quantity: dto.quantity,
          imageMediaIds: dto.imageMediaIds,
          resolutionType,
          replacementVariantId: resolutionType === "REPLACEMENT" ? dto.replacementVariantId : undefined,
        });
      } catch (error) {
        const isCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          (error.meta?.target as string[] | undefined)?.includes("returnNumber");
        if (isCollision && attempt < RETURN_NUMBER_RETRY_ATTEMPTS) continue;
        throw error;
      }
    }
    throw new ConflictException("Could not generate a unique return number — please try again");
  }

  async listForCustomer(customerId: string, page: number, limit: number) {
    const { items, totalItems } = await this.repo.findCustomerReturns(customerId, page, limit);
    return { data: items, meta: paginate(page, limit, totalItems) };
  }

  async findForCustomer(id: string, customerId: string) {
    return this.assertOwnedByCustomer(id, customerId);
  }

  async cancel(id: string, customerId: string) {
    const ret = await this.assertOwnedByCustomer(id, customerId);
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(ret.status)) {
      throw new BadRequestException("This return can no longer be cancelled");
    }
    return this.repo.updateStatus(id, "CANCELLED", "CUSTOMER", customerId);
  }

  async listForMerchant(merchantId: string, query: MerchantReturnQueryDto) {
    const { items, totalItems } = await this.repo.findMerchantReturns({
      merchantId,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findForMerchant(id: string, merchantId: string) {
    return this.assertOwnedByMerchant(id, merchantId);
  }

  async approve(id: string, merchantId: string) {
    const ret = await this.assertOwnedByMerchant(id, merchantId);
    if (!MERCHANT_DECIDABLE_STATUSES.includes(ret.status)) {
      throw new BadRequestException("This return has already been decided");
    }
    let updated: ReturnDetail;
    try {
      updated = await this.repo.approveReturn(
        id,
        merchantId,
        ret.resolutionType === "REPLACEMENT" ? ret.replacementVariantId : null,
        ret.quantity,
      );
    } catch (error) {
      if (error instanceof InsufficientReplacementStockError) {
        throw new BadRequestException("Not enough stock to fulfill this replacement right now");
      }
      throw error;
    }
    void this.notifications.create(
      "CUSTOMER", ret.customerId,
      "RETURN_APPROVED",
      "Return request approved",
      "The merchant has approved your return. Please ship the item back as instructed.",
      { returnId: id },
    );
    return updated;
  }

  async reject(id: string, merchantId: string, note: string) {
    const ret = await this.assertOwnedByMerchant(id, merchantId);
    if (!MERCHANT_DECIDABLE_STATUSES.includes(ret.status)) {
      throw new BadRequestException("This return has already been decided");
    }
    const updated = await this.repo.updateStatus(id, "REJECTED", "MERCHANT", merchantId, note);
    void this.notifications.create(
      "CUSTOMER", ret.customerId,
      "RETURN_REJECTED",
      "Return request rejected",
      `Your return request was rejected. Reason: ${note}`,
      { returnId: id },
    );
    return updated;
  }

  async merchantUpdateStatus(id: string, merchantId: string, dto: MerchantUpdateReturnStatusDto) {
    const ret = await this.assertOwnedByMerchant(id, merchantId);
    if (dto.status === "ITEM_RECEIVED" && ret.status !== "AWAITING_SHIPMENT") {
      throw new BadRequestException("Return must be AWAITING_SHIPMENT before marking item received");
    }
    if (dto.status === "COMPLETED" && ret.status !== "ITEM_RECEIVED") {
      throw new BadRequestException("Return must be ITEM_RECEIVED before completing");
    }
    if (dto.status === "ITEM_RECEIVED") {
      // Restocks the originally-purchased variant — applies to both a plain
      // refund and a replacement, since the physical item comes back either way.
      return this.repo.markItemReceived(id, merchantId, ret.orderItem.variantId, ret.quantity);
    }
    return this.repo.updateStatus(id, dto.status, "MERCHANT", merchantId);
  }

  async listReplacementOptions(orderItemId: string, customerId: string) {
    const orderItem = await this.repo.findOrderItemForReturn(orderItemId, customerId);
    if (!orderItem) throw new NotFoundException("Order item not found");
    return this.repo.findReplacementVariants(orderItem.variant.productId);
  }

  async listForAdmin(query: AdminReturnQueryDto) {
    const { items, totalItems } = await this.repo.findAdminReturns({
      status: query.status,
      merchantId: query.merchantId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findForAdmin(id: string) {
    const ret = await this.repo.findById(id);
    if (!ret) throw new NotFoundException("Return not found");
    return ret;
  }

  async adminOverride(id: string, adminId: string, dto: AdminUpdateReturnStatusDto) {
    const ret = await this.findForAdmin(id);
    const updated = await this.repo.updateStatus(id, dto.status, "ADMIN", adminId, dto.note, dto.refundAmount);
    if (dto.status === "COMPLETED") {
      void this.notifications.create(
        "CUSTOMER", ret.customerId,
        "RETURN_COMPLETED",
        "Return completed — refund processed",
        dto.note ?? "Your return has been completed. Refund will appear in 3–5 business days.",
        { returnId: id },
      );
    }
    return updated;
  }

  private async assertOwnedByCustomer(id: string, customerId: string): Promise<ReturnDetail> {
    const ret = await this.repo.findById(id);
    if (!ret || ret.customerId !== customerId) throw new NotFoundException("Return not found");
    return ret;
  }

  private async assertOwnedByMerchant(id: string, merchantId: string): Promise<ReturnDetail> {
    const ret = await this.repo.findById(id);
    if (!ret || ret.merchantId !== merchantId) throw new NotFoundException("Return not found");
    return ret;
  }
}
