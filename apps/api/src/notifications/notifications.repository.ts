import { Injectable } from "@nestjs/common";
import type { ActorType, NotificationRecipientType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const RECIPIENT_TYPE_BY_ACTOR: Record<"ADMIN" | "MERCHANT" | "CUSTOMER", NotificationRecipientType> = {
  ADMIN: "ADMIN",
  MERCHANT: "MERCHANT",
  CUSTOMER: "CUSTOMER",
};

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    recipientType: "ADMIN" | "MERCHANT" | "CUSTOMER";
    recipientId: string;
    type: string;
    title: string;
    message: string;
    data?: Prisma.InputJsonValue;
  }) {
    const recipientType = RECIPIENT_TYPE_BY_ACTOR[data.recipientType];
    return this.prisma.notification.create({
      data: {
        recipientType,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        ...(data.recipientType === "ADMIN" ? { adminUserId: data.recipientId } : {}),
        ...(data.recipientType === "MERCHANT" ? { merchantId: data.recipientId } : {}),
        ...(data.recipientType === "CUSTOMER" ? { customerId: data.recipientId } : {}),
      },
    });
  }

  async findForPrincipal(
    type: "ADMIN" | "MERCHANT" | "CUSTOMER",
    id: string,
    unreadOnly: boolean,
    page: number,
    limit: number,
  ) {
    const recipientType = RECIPIENT_TYPE_BY_ACTOR[type];
    const where: Prisma.NotificationWhereInput = {
      recipientType,
      ...(type === "ADMIN" ? { adminUserId: id } : {}),
      ...(type === "MERCHANT" ? { merchantId: id } : {}),
      ...(type === "CUSTOMER" ? { customerId: id } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
    };
    const [items, totalItems, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    return { items, totalItems, unreadCount };
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  }

  markAllRead(type: "ADMIN" | "MERCHANT" | "CUSTOMER", id: string) {
    const recipientType = RECIPIENT_TYPE_BY_ACTOR[type];
    return this.prisma.notification.updateMany({
      where: {
        recipientType,
        isRead: false,
        ...(type === "ADMIN" ? { adminUserId: id } : {}),
        ...(type === "MERCHANT" ? { merchantId: id } : {}),
        ...(type === "CUSTOMER" ? { customerId: id } : {}),
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  upsertDeviceToken(token: string, principalType: ActorType, principalId: string, platform?: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { principalType, principalId, platform, lastSeenAt: new Date() },
      create: { token, principalType, principalId, platform },
    });
  }
}
