import { ApiProperty } from "@nestjs/swagger";
import type { ActorType } from "@prisma/client";
import { IsEmail, IsIn } from "class-validator";

export const LOGINABLE_PRINCIPAL_TYPES = ["ADMIN", "MERCHANT", "CUSTOMER"] as const;
export type LoginablePrincipalType = Exclude<ActorType, "SYSTEM">;

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: LOGINABLE_PRINCIPAL_TYPES })
  @IsIn(LOGINABLE_PRINCIPAL_TYPES)
  principalType!: LoginablePrincipalType;
}
