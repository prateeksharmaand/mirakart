import { ApiProperty } from "@nestjs/swagger";
import type { MerchantDocumentStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";

const DOCUMENT_STATUSES: MerchantDocumentStatus[] = ["VERIFIED", "REJECTED"];

export class ReviewDocumentDto {
  @ApiProperty({ enum: DOCUMENT_STATUSES, description: "Document verification status" })
  @IsIn(DOCUMENT_STATUSES)
  status!: MerchantDocumentStatus;

  @ApiProperty({ required: false, description: "Reason for rejection" })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
