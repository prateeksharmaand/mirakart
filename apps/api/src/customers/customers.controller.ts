import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth, CustomerAuth } from "../auth/decorators/auth.decorators";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedPrincipal } from "../auth/types/jwt-payload.interface";
import { CreateAddressDto } from "./dto/create-address.dto";
import { CustomerQueryDto } from "./dto/customer-query.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { UpdateCustomerProfileDto } from "./dto/update-customer-profile.dto";
import { CustomersService } from "./customers.service";

@ApiTags("customers")
@Controller("customers")
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  // --- Customer self-service (must be registered before ":id" routes) ---

  @Get("me")
  @CustomerAuth()
  @ApiOkResponse()
  me(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.findOne(user.id);
  }

  @Patch("me")
  @CustomerAuth()
  @ApiOkResponse()
  updateMe(@Body() dto: UpdateCustomerProfileDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.updateProfile(user.id, dto);
  }

  @Get("me/addresses")
  @CustomerAuth()
  @ApiOkResponse()
  myAddresses(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.listAddresses(user.id);
  }

  @Post("me/addresses")
  @CustomerAuth()
  @ApiCreatedResponse()
  addAddress(@Body() dto: CreateAddressDto, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.createAddress(user.id, dto);
  }

  @Patch("me/addresses/:id")
  @CustomerAuth()
  @ApiOkResponse()
  updateAddress(
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: AuthenticatedPrincipal,
  ) {
    return this.service.updateAddress(id, user.id, dto);
  }

  @Delete("me/addresses/:id")
  @CustomerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAddress(@Param("id") id: string, @CurrentUser() user: AuthenticatedPrincipal) {
    return this.service.removeAddress(id, user.id);
  }

  // --- Admin ---

  @Get()
  @AdminAuth("customer.view")
  @ApiOkResponse()
  list(@Query() query: CustomerQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  @AdminAuth("customer.view")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id/block")
  @AdminAuth("customer.edit")
  @ApiOkResponse()
  block(@Param("id") id: string) {
    return this.service.block(id);
  }
}
