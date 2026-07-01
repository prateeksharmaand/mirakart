import { ApiProperty } from "@nestjs/swagger";

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: "Access token lifetime in seconds" })
  expiresIn!: number;
}

export class AdminAuthResponseDto extends AuthTokensDto {
  @ApiProperty()
  admin!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperAdmin: boolean;
  };
}

export class MerchantAuthResponseDto extends AuthTokensDto {
  @ApiProperty()
  merchant!: {
    id: string;
    email: string;
    storeName: string;
    storeSlug: string;
    status: string;
  };
}

export class CustomerAuthResponseDto extends AuthTokensDto {
  @ApiProperty()
  customer!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
