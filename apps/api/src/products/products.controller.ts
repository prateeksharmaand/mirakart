import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ProductQueryDto } from "./dto/product-query.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOkResponse()
  list(@Query() query: ProductQueryDto) {
    return this.service.listPublic(query);
  }

  @Get("price-range")
  @ApiOkResponse()
  priceRange(@Query() query: ProductQueryDto) {
    return this.service.getPriceRange(query);
  }

  @Get("deals")
  @ApiOkResponse()
  deals(@Query("limit") limit?: string) {
    const parsed = Number(limit);
    return this.service.getActiveDeals(Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 8);
  }

  @Get(":slug")
  @ApiOkResponse()
  findBySlug(@Param("slug") slug: string) {
    return this.service.findPublicBySlug(slug);
  }
}
