import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ActorType, Prisma } from "@prisma/client";
import { NotificationsRepository } from "./notifications.repository";

type RecipientType = "ADMIN" | "MERCHANT" | "CUSTOMER";

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  /** Called by other modules to create a notification — see docs/architecture.md follow-up note. */
  create(recipientType: RecipientType, recipientId: string, type: string, title: string, message: string, data?: Prisma.InputJsonValue) {
    return this.repo.create({ recipientType, recipientId, type, title, message, data });
  }

  async list(principalType: RecipientType, principalId: string, unreadOnly: boolean, page: number, limit: number) {
    const { items, totalItems, unreadCount } = await this.repo.findForPrincipal(
      principalType,
      principalId,
      unreadOnly,
      page,
      limit,
    );
    return { data: items, meta: { ...paginate(page, limit, totalItems), unreadCount } };
  }

  async markRead(id: string, principalType: RecipientType, principalId: string) {
    const notification = await this.assertOwned(id, principalType, principalId);
    if (notification.isRead) return notification;
    return this.repo.markRead(id);
  }

  async markAllRead(principalType: RecipientType, principalId: string): Promise<void> {
    await this.repo.markAllRead(principalType, principalId);
  }

  registerDeviceToken(token: string, principalType: ActorType, principalId: string, platform?: string) {
    return this.repo.upsertDeviceToken(token, principalType, principalId, platform);
  }

  private async assertOwned(id: string, principalType: RecipientType, principalId: string) {
    const notification = await this.repo.findById(id);
    if (!notification) throw new NotFoundException("Notification not found");

    const ownerId =
      principalType === "ADMIN"
        ? notification.adminUserId
        : principalType === "MERCHANT"
          ? notification.merchantId
          : notification.customerId;
    if (ownerId !== principalId) throw new ForbiddenException("This notification does not belong to you");
    return notification;
  }
}
