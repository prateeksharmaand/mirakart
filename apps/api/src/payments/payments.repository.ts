import { Injectable } from "@nestjs/common";
import type { PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId }, include: { order: true } });
  }

  findByProviderReference(providerPaymentId: string) {
    return this.prisma.payment.findFirst({ where: { providerPaymentId }, include: { order: true } });
  }

  setProviderReference(id: string, data: { provider: string; providerPaymentId: string }) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async markResolved(
    id: string,
    orderId: string,
    data: { status: PaymentStatus; providerPaymentId?: string; paidAt?: Date },
    orderStatus?: "CONFIRMED" | "CANCELLED",
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({ where: { id }, data });
      if (orderStatus) {
        await tx.order.update({ where: { id: orderId }, data: { status: orderStatus } });
        await tx.orderStatusHistory.create({ data: { orderId, status: orderStatus } });
      }
      return payment;
    });
  }

  /**
   * Manual COD collection: flips Payment UNPAID -> PAID and Order -> COMPLETED
   * in one transaction, mirroring markResolved's "update Payment + Order
   * together" shape. Also writes the OrderStatusHistory row for the
   * resulting COMPLETED order status (markResolved's caller — the Razorpay
   * webhook path — doesn't need this since it only touches CONFIRMED/
   * CANCELLED via a different code path already covered there).
   */
  async markCodReceived(
    paymentId: string,
    orderId: string,
    data: { amountReceived: number; receivedDate: Date; remarks?: string; adminId: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
          paidAt: data.receivedDate,
          amountReceived: data.amountReceived,
          collectedByAdminId: data.adminId,
          collectionNote: data.remarks,
        },
      });
      const order = await tx.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "COMPLETED", changedByType: "ADMIN", changedById: data.adminId, note: data.remarks },
      });
      return { payment, order };
    });
  }

  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });
  }

  updateIdempotencyMetadata(
    id: string,
    data: { wasIdempotent?: boolean; attemptCount?: { increment: number } },
  ) {
    return this.prisma.payment.update({ where: { id }, data });
  }
}
