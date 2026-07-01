import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let repo: jest.Mocked<PaymentsRepository>;
  let razorpay: jest.Mocked<RazorpayService>;

  beforeEach(() => {
    repo = {
      findByOrderId: jest.fn(),
      findByProviderReference: jest.fn(),
      setProviderReference: jest.fn(),
      markResolved: jest.fn(),
    } as unknown as jest.Mocked<PaymentsRepository>;
    razorpay = {
      createOrder: jest.fn(),
      verifyWebhookSignature: jest.fn(),
    } as unknown as jest.Mocked<RazorpayService>;
    service = new PaymentsService(repo, razorpay, new ConfigService({ RAZORPAY_KEY_ID: "rzp_test" }));
  });

  describe("initiate", () => {
    it("throws NotFoundException for an order that isn't the customer's", async () => {
      repo.findByOrderId.mockResolvedValue({ order: { customerId: "someone-else" } } as never);
      await expect(service.initiate("order1", "c1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("refuses to initiate online payment for a COD order", async () => {
      repo.findByOrderId.mockResolvedValue({
        method: "COD",
        order: { customerId: "c1" },
      } as never);
      await expect(service.initiate("order1", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("refuses to re-initiate an already-processed payment", async () => {
      repo.findByOrderId.mockResolvedValue({
        method: "CARD",
        status: "CAPTURED",
        order: { customerId: "c1" },
      } as never);
      await expect(service.initiate("order1", "c1")).rejects.toBeInstanceOf(ConflictException);
    });

    it("creates a Razorpay order and stores the provider reference", async () => {
      repo.findByOrderId.mockResolvedValue({
        id: "pay1",
        method: "CARD",
        status: "PENDING",
        amount: 499.5,
        currency: "INR",
        order: { customerId: "c1", orderNumber: "ORD-1" },
      } as never);
      razorpay.createOrder.mockResolvedValue({ id: "rzp_order_1", amount: 49950, currency: "INR" } as never);

      const result = await service.initiate("order1", "c1");

      expect(razorpay.createOrder).toHaveBeenCalledWith(499.5, "INR", "ORD-1");
      expect(repo.setProviderReference).toHaveBeenCalledWith("pay1", {
        provider: "razorpay",
        providerPaymentId: "rzp_order_1",
      });
      expect(result.providerOrderId).toBe("rzp_order_1");
    });
  });

  describe("handleWebhook", () => {
    const rawBody = Buffer.from('{"event":"payment.captured"}');

    it("throws UnauthorizedException for an invalid signature", async () => {
      razorpay.verifyWebhookSignature.mockReturnValue(false);
      await expect(
        service.handleWebhook(rawBody, "bad-sig", { event: "payment.captured" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("ignores a payload with no payment entity", async () => {
      razorpay.verifyWebhookSignature.mockReturnValue(true);
      await service.handleWebhook(rawBody, "sig", { event: "payment.captured" });
      expect(repo.findByProviderReference).not.toHaveBeenCalled();
    });

    it("is a no-op for an unknown provider order id", async () => {
      razorpay.verifyWebhookSignature.mockReturnValue(true);
      repo.findByProviderReference.mockResolvedValue(null);
      await service.handleWebhook(rawBody, "sig", {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1", order_id: "rzp_order_unknown" } } },
      });
      expect(repo.markResolved).not.toHaveBeenCalled();
    });

    it("is idempotent — does nothing if the payment is already resolved", async () => {
      razorpay.verifyWebhookSignature.mockReturnValue(true);
      repo.findByProviderReference.mockResolvedValue({ id: "pay1", orderId: "order1", status: "CAPTURED" } as never);
      await service.handleWebhook(rawBody, "sig", {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1", order_id: "rzp_order_1" } } },
      });
      expect(repo.markResolved).not.toHaveBeenCalled();
    });

    it("captures a pending payment and confirms the order", async () => {
      razorpay.verifyWebhookSignature.mockReturnValue(true);
      repo.findByProviderReference.mockResolvedValue({ id: "pay1", orderId: "order1", status: "PENDING" } as never);
      await service.handleWebhook(rawBody, "sig", {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1", order_id: "rzp_order_1" } } },
      });
      expect(repo.markResolved).toHaveBeenCalledWith(
        "pay1",
        "order1",
        expect.objectContaining({ status: "CAPTURED", providerPaymentId: "pay_1" }),
        "CONFIRMED",
      );
    });

    it("marks a failed payment without confirming the order", async () => {
      razorpay.verifyWebhookSignature.mockReturnValue(true);
      repo.findByProviderReference.mockResolvedValue({ id: "pay1", orderId: "order1", status: "PENDING" } as never);
      await service.handleWebhook(rawBody, "sig", {
        event: "payment.failed",
        payload: { payment: { entity: { id: "pay_1", order_id: "rzp_order_1" } } },
      });
      expect(repo.markResolved).toHaveBeenCalledWith("pay1", "order1", { status: "FAILED" });
    });
  });
});
