import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from "./password.constraint";

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
