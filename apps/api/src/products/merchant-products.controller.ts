import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MerchantAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { AddProductImageDto } from "./dto/add-product-image.dto";
import { ReorderImagesDto } from "./dto/reorder-images.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { MerchantProductQueryDto } from "./dto/merchant-product-query.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";
import { ProductsService } from "./products.service";

@ApiTags("merchant-products")
@MerchantAuth()
@Controller("merchants/me/products")
export class MerchantProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: MerchantProductQueryDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listForMerchant(user.id, query);
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findMerchantProduct(id, user.id);
  }

  @Post()
  @ApiCreatedResponse()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.remove(id, user.id);
  }

  @Post(":id/variants")
  @ApiCreatedResponse()
  addVariant(
    @Param("id") id: string,
    @Body() dto: CreateVariantDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.addVariant(id, user.id, dto);
  }

  @Patch(":id/variants/:variantId")
  @ApiOkResponse()
  updateVariant(
    @Param("id") id: string,
    @Param("variantId") variantId: string,
    @Body() dto: UpdateVariantDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.updateVariant(id, variantId, user.id, dto);
  }

  @Delete(":id/variants/:variantId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeVariant(
    @Param("id") id: string,
    @Param("variantId") variantId: string,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.removeVariant(id, variantId, user.id);
  }

  @Patch(":id/variants/:variantId/inventory")
  @ApiOkResponse()
  updateInventory(
    @Param("id") id: string,
    @Param("variantId") variantId: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.updateInventory(id, variantId, user.id, dto);
  }

  @Get(":id/images")
  @ApiOkResponse()
  listImages(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listImages(id, user.id);
  }

  @Post(":id/images")
  @ApiCreatedResponse()
  addImage(
    @Param("id") id: string,
    @Body() dto: AddProductImageDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.addImage(id, user.id, dto);
  }

  @Patch(":id/images/reorder")
  @ApiOkResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  reorderImages(
    @Param("id") id: string,
    @Body() dto: ReorderImagesDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.reorderImages(id, user.id, dto.items);
  }

  @Patch(":id/images/:imageId/primary")
  @ApiOkResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  setPrimaryImage(
    @Param("id") id: string,
    @Param("imageId") imageId: string,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.setPrimaryImage(id, imageId, user.id);
  }

  @Delete(":id/images/:imageId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @Param("id") id: string,
    @Param("imageId") imageId: string,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.removeImage(id, imageId, user.id);
  }
}
