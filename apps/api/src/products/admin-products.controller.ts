import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { AdminProductQueryDto } from "./dto/merchant-product-query.dto";
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

  @Get(":id/images")
  @AdminAuth("product.view")
  @ApiOkResponse()
  listImages(@Param("id") id: string) {
    return this.service.listImagesAdmin(id);
  }

  /** Trust & safety override — the only admin writes left on products. Force-hides
   *  a listing regardless of the merchant's own status choice; everything else
   *  about a product (creation, editing, archive/featured) is merchant-owned. */
  @Patch(":id/suspend")
  @AdminAuth("product.edit")
  @ApiOkResponse()
  suspend(@Param("id") id: string) {
    return this.service.suspend(id);
  }

  /** Undoes suspend() — a merchant can't self-reactivate a suspended product
   *  (see ProductsService.update), so admin is the only path back. */
  @Patch(":id/activate")
  @AdminAuth("product.edit")
  @ApiOkResponse()
  activate(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.activate(id, user.id);
  }
}
