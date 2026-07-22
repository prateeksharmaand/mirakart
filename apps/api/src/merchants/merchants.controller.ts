import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth, MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CreateMerchantDocumentDto } from "./dto/create-merchant-document.dto";
import { MerchantQueryDto } from "./dto/merchant-query.dto";
import { RejectMerchantDto } from "./dto/reject-merchant.dto";
import { ReviewDocumentDto } from "./dto/review-document.dto";
import { UpdateMerchantProfileDto } from "./dto/update-merchant-profile.dto";
import { MerchantsService } from "./merchants.service";

@ApiTags("merchants")
@Controller("merchants")
export class MerchantsController {
  constructor(private readonly service: MerchantsService) {}

  // --- Merchant self-service (must be registered before ":id" routes) ---

  @Get("me")
  @MerchantAuth()
  @ApiOkResponse()
  me(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findOne(user.id);
  }

  @Patch("me")
  @MerchantAuth()
  @ApiOkResponse()
  updateMe(@Body() dto: UpdateMerchantProfileDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.updateProfile(user.id, dto);
  }

  @Get("me/documents")
  @MerchantAuth()
  @ApiOkResponse()
  myDocuments(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listDocuments(user.id);
  }

  @Post("me/documents")
  @MerchantAuth()
  @ApiCreatedResponse()
  addMyDocument(@Body() dto: CreateMerchantDocumentDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.addDocument(user.id, dto);
  }

  // --- Admin ---

  @Get()
  @AdminAuth("merchant.view")
  @ApiOkResponse()
  list(@Query() query: MerchantQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @AdminAuth("merchant.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/stats")
  @AdminAuth("merchant.view")
  @ApiOkResponse()
  stats(@Param("id") id: string) {
    return this.service.getStats(id);
  }

  @Get(":id/documents")
  @AdminAuth("merchant.view")
  @ApiOkResponse()
  documents(@Param("id") id: string) {
    return this.service.listDocuments(id);
  }

  @Patch(":id/documents/:docId")
  @AdminAuth("merchant.approve")
  @ApiOkResponse()
  reviewDocument(@Param("docId") docId: string, @Body() dto: ReviewDocumentDto) {
    return this.service.reviewDocument(docId, dto);
  }

  @Patch(":id/approve")
  @AdminAuth("merchant.approve")
  @ApiOkResponse()
  approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.approve(id, user.id);
  }

  @Patch(":id/reject")
  @AdminAuth("merchant.reject")
  @ApiOkResponse()
  reject(@Param("id") id: string, @Body() dto: RejectMerchantDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.reject(id, user.id, dto.rejectionReason);
  }

  @Patch(":id/suspend")
  @AdminAuth("merchant.edit")
  @ApiOkResponse()
  suspend(@Param("id") id: string) {
    return this.service.suspend(id);
  }
}
