import { ApiProperty } from "@nestjs/swagger";
import type { MerchantDocumentType } from "@prisma/client";
import { IsIn, IsString } from "class-validator";

const DOCUMENT_TYPES: MerchantDocumentType[] = [
  "BUSINESS_LICENSE",
  "TAX_CERTIFICATE",
  "ID_PROOF",
  "BANK_DETAILS",
  "OTHER",
];

export class CreateMerchantDocumentDto {
  @ApiProperty({ description: "Media id returned by POST /uploads (purpose: MERCHANT_DOCUMENTS)" })
  @IsString()
  mediaId!: string;

  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  type!: MerchantDocumentType;
}
