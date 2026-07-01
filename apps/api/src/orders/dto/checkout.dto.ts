import { ApiProperty } from "@nestjs/swagger";
import type { PaymentMethod } from "@prisma/client";
import { IsIn, IsString } from "class-validator";

const PAYMENT_METHODS: PaymentMethod[] = ["CARD", "UPI", "NETBANKING", "WALLET", "COD"];

export class CheckoutDto {
  @ApiProperty()
  @IsString()
  shippingAddressId!: string;

  @ApiProperty()
  @IsString()
  billingAddressId!: string;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS)
  paymentMethod!: PaymentMethod;
}
