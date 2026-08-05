import { BadRequestException, ConflictException } from "@nestjs/common";
import { CouponsRepository } from "./coupons.repository";
import { CouponsService } from "./coupons.service";

describe("CouponsService", () => {
  let service: CouponsService;
  let repo: jest.Mocked<CouponsRepository>;

  function makeCoupon(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: "coupon1",
      merchantId: "m1",
      code: "SAVE10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscountAmount: null,
      minOrderValue: null,
      usageLimit: null,
      perCustomerLimit: null,
      usedCount: 0,
      isActive: true,
      startsAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    repo = {
      findMerchantList: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countCustomerRedemptions: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<CouponsRepository>;
    service = new CouponsService(repo);
  });

  describe("create", () => {
    it("rejects a percentage discount over 100", async () => {
      repo.findByCode.mockResolvedValue(null);
      await expect(
        service.create("m1", { code: "BIG", discountType: "PERCENTAGE", discountValue: 150 } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a duplicate code", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon() as never);
      await expect(
        service.create("m1", { code: "SAVE10", discountType: "PERCENTAGE", discountValue: 10 } as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("update", () => {
    it("allows keeping a coupon's own code unchanged", async () => {
      const coupon = makeCoupon();
      repo.findById.mockResolvedValue(coupon as never);
      repo.findByCode.mockResolvedValue(coupon as never);
      repo.update.mockResolvedValue(coupon as never);
      await expect(service.update("coupon1", "m1", { code: "SAVE10" } as never)).resolves.toBeDefined();
    });

    it("rejects renaming to another coupon's code", async () => {
      const coupon = makeCoupon();
      repo.findById.mockResolvedValue(coupon as never);
      repo.findByCode.mockResolvedValue(makeCoupon({ id: "coupon2", code: "OTHER" }) as never);
      await expect(service.update("coupon1", "m1", { code: "OTHER" } as never)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("priceCartForCoupon", () => {
    const lines = [
      { merchantId: "m1", unitPrice: 500, quantity: 2 }, // this merchant's items: 1000
      { merchantId: "m2", unitPrice: 300, quantity: 1 }, // a different merchant's items: 300
    ];

    it("rejects an unknown code", async () => {
      repo.findByCode.mockResolvedValue(null);
      await expect(service.priceCartForCoupon(lines, "NOPE", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects an inactive coupon", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ isActive: false }) as never);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a coupon that hasn't started yet", async () => {
      const future = new Date(Date.now() + 86_400_000);
      repo.findByCode.mockResolvedValue(makeCoupon({ startsAt: future }) as never);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects an expired coupon", async () => {
      const past = new Date(Date.now() - 86_400_000);
      repo.findByCode.mockResolvedValue(makeCoupon({ expiresAt: past }) as never);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects once the global usage limit is reached", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ usageLimit: 5, usedCount: 5 }) as never);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects once the customer has hit their per-customer limit", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ perCustomerLimit: 1 }) as never);
      repo.countCustomerRedemptions.mockResolvedValue(1);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the cart has no items from this coupon's merchant", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ merchantId: "m-unrelated" }) as never);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the qualifying merchant's subtotal is below minOrderValue", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ minOrderValue: 2000 }) as never);
      await expect(service.priceCartForCoupon(lines, "SAVE10", "c1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("only discounts the coupon's own merchant's items, never another merchant's", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ discountType: "PERCENTAGE", discountValue: 10 }) as never);
      const result = await service.priceCartForCoupon(lines, "SAVE10", "c1");
      // 10% of merchant m1's 1000 subtotal only — m2's 300 is never touched
      expect(result.discountAmount).toBe(100);
      expect(result.qualifyingMerchantId).toBe("m1");
    });

    it("caps a percentage discount at maxDiscountAmount", async () => {
      repo.findByCode.mockResolvedValue(
        makeCoupon({ discountType: "PERCENTAGE", discountValue: 50, maxDiscountAmount: 200 }) as never,
      );
      const result = await service.priceCartForCoupon(lines, "SAVE10", "c1");
      // 50% of 1000 would be 500, but capped at 200
      expect(result.discountAmount).toBe(200);
    });

    it("caps a fixed discount at the qualifying subtotal so it can't go negative", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ discountType: "FIXED", discountValue: 5000 }) as never);
      const result = await service.priceCartForCoupon(lines, "SAVE10", "c1");
      // Fixed ₹5000 off would exceed m1's ₹1000 subtotal — clamped to 1000
      expect(result.discountAmount).toBe(1000);
    });

    it("applies a plain fixed discount within bounds", async () => {
      repo.findByCode.mockResolvedValue(makeCoupon({ discountType: "FIXED", discountValue: 150 }) as never);
      const result = await service.priceCartForCoupon(lines, "SAVE10", "c1");
      expect(result.discountAmount).toBe(150);
    });
  });
});
