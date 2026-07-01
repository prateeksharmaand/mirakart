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
}
