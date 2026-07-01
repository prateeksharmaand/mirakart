import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, Matches } from "class-validator";
import { LOGINABLE_PRINCIPAL_TYPES, type LoginablePrincipalType } from "./forgot-password.dto";
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from "./password.constraint";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ enum: LOGINABLE_PRINCIPAL_TYPES })
  @IsIn(LOGINABLE_PRINCIPAL_TYPES)
  principalType!: LoginablePrincipalType;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
