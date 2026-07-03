import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { AddProductImageDto } from "./dto/add-product-image.dto";
import { ReorderImagesDto } from "./dto/reorder-images.dto";
import { AdminProductQueryDto } from "./dto/merchant-product-query.dto";
import { RejectProductDto } from "./dto/reject-product.dto";
import { SetFeaturedDto } from "./dto/set-featured.dto";
import { ProductsService } from "./products.service";

@ApiTags("admin-products")
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @AdminAuth("product.view")
  @ApiOkResponse()
  list(@Query() query: AdminProductQueryDto) {
    return this.service.listForAdmin(query);
  }

  @Get(":id")
  @AdminAuth("product.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findAdminProduct(id);
  }

  @Patch(":id/approve")
  @AdminAuth("product.approve")
  @ApiOkResponse()
  approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.approve(id, user.id);
  }

  @Patch(":id/reject")
  @AdminAuth("product.reject")
  @ApiOkResponse()
  reject(@Param("id") id: string, @Body() dto: RejectProductDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.reject(id, user.id, dto.rejectionReason);
  }

  @Patch(":id/featured")
  @AdminAuth("product.edit")
  @ApiOkResponse()
  setFeatured(@Param("id") id: string, @Body() dto: SetFeaturedDto) {
    return this.service.setFeatured(id, dto.isFeatured);
  }

  // --- Images ---

  @Get(":id/images")
  @AdminAuth("product.view")
  @ApiOkResponse()
  listImages(@Param("id") id: string) {
    return this.service.listImagesAdmin(id);
  }

  @Post(":id/images")
  @AdminAuth("product.edit")
  @ApiCreatedResponse()
  addImage(@Param("id") id: string, @Body() dto: AddProductImageDto) {
    return this.service.addImageAdmin(id, dto);
  }

  @Patch(":id/images/reorder")
  @AdminAuth("product.edit")
  @HttpCode(HttpStatus.NO_CONTENT)
  reorderImages(@Param("id") id: string, @Body() dto: ReorderImagesDto) {
    return this.service.reorderImagesAdmin(id, dto.items);
  }

  @Patch(":id/images/:imageId/primary")
  @AdminAuth("product.edit")
  @HttpCode(HttpStatus.NO_CONTENT)
  setPrimaryImage(@Param("id") id: string, @Param("imageId") imageId: string) {
    return this.service.setPrimaryImageAdmin(id, imageId);
  }

  @Delete(":id/images/:imageId")
  @AdminAuth("product.edit")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(@Param("id") id: string, @Param("imageId") imageId: string) {
    return this.service.removeImageAdmin(id, imageId);
  }
}
