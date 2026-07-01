import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentsRepository } from "./payments.repository";
import { RazorpayService } from "./razorpay.service";

export interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: { id: string; order_id: string };
    };
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly repo: PaymentsRepository,
    private readonly razorpay: RazorpayService,
    private readonly config: ConfigService,
  ) {}

  async initiate(orderId: string, customerId: string) {
    const payment = await this.findOwnedByCustomer(orderId, customerId);
    if (payment.method === "COD") {
      throw new BadRequestException("Cash-on-delivery orders do not require online payment");
    }
    if (payment.status !== "PENDING") {
      throw new ConflictException("This order's payment has already been processed");
    }

    const razorpayOrder = await this.razorpay.createOrder(
      Number(payment.amount),
      payment.currency,
      payment.order.orderNumber,
    );
    await this.repo.setProviderReference(payment.id, {
      provider: "razorpay",
      providerPaymentId: razorpayOrder.id,
    });

    return {
      provider: "razorpay",
      keyId: this.config.get<string>("RAZORPAY_KEY_ID"),
      providerOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    };
  }

  async getPayment(orderId: string, requester: { type: "CUSTOMER" | "ADMIN"; id: string }) {
    const payment = await this.repo.findByOrderId(orderId);
    if (!payment) throw new NotFoundException("Payment not found");
    if (requester.type === "CUSTOMER" && payment.order.customerId !== requester.id) {
      throw new NotFoundException("Payment not found");
    }
    return payment;
  }

  async handleWebhook(rawBody: Buffer, signatureHeader: string | undefined, body: RazorpayWebhookPayload) {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signatureHeader)) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const entity = body.payload?.payment?.entity;
    if (!entity) return;

    const payment = await this.repo.findByProviderReference(entity.order_id);
    if (!payment) {
      this.logger.warn(`Webhook for unknown provider order ${entity.order_id}`);
      return;
    }
    if (payment.status !== "PENDING") return; // already resolved — idempotent no-op

    if (body.event === "payment.captured") {
      await this.repo.markResolved(
        payment.id,
        payment.orderId,
        { status: "CAPTURED", providerPaymentId: entity.id, paidAt: new Date() },
        "CONFIRMED",
      );
    } else if (body.event === "payment.failed") {
      await this.repo.markResolved(payment.id, payment.orderId, { status: "FAILED" });
    }
  }

  private async findOwnedByCustomer(orderId: string, customerId: string) {
    const payment = await this.repo.findByOrderId(orderId);
    if (!payment || payment.order.customerId !== customerId) {
      throw new NotFoundException("Order not found");
    }
    return payment;
  }
}
