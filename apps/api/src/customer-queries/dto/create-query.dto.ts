import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateQueryDto {
  @IsString()
  @MinLength(10)
  question!: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}

export class AnswerQueryDto {
  @IsString()
  @MinLength(5)
  answer!: string;
}
