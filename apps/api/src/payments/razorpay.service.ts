import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";

@Injectable()
export class RazorpayService implements OnModuleInit {
  private client!: Razorpay;
  private webhookSecret!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Razorpay({
      key_id: this.config.get<string>("RAZORPAY_KEY_ID", ""),
      key_secret: this.config.get<string>("RAZORPAY_KEY_SECRET", ""),
    });
    this.webhookSecret = this.config.get<string>("RAZORPAY_KEY_SECRET", "");
  }

  /** Amount in the smallest currency unit (paise for INR). */
  createOrder(amount: number, currency: string, receipt: string) {
    return this.client.orders.create({ amount: Math.round(amount * 100), currency, receipt });
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const expected = createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const actualBuffer = Buffer.from(signatureHeader, "utf8");
    if (expectedBuffer.length !== actualBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
