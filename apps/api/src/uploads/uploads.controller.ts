import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { AnyPrincipalAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CreateUploadDto } from "./dto/create-upload.dto";
import { UploadsService } from "./uploads.service";

@ApiTags("uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post()
  @AnyPrincipalAuth()
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        purpose: { type: "string" },
      },
    },
  })
  @ApiCreatedResponse()
  upload(
    @Body() dto: CreateUploadDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.upload(dto.purpose, file, user);
  }

  @Delete(":mediaId")
  @AnyPrincipalAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("mediaId") mediaId: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.remove(mediaId, user);
  }
}
