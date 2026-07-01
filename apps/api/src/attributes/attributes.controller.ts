import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuth } from "../auth/decorators/auth.decorators";
import { AttributesService } from "./attributes.service";
import { CreateAttributeDto, CreateAttributeValueDto } from "./dto/create-attribute.dto";
import { UpdateAttributeDto } from "./dto/update-attribute.dto";

@ApiTags("attributes")
@Controller("attributes")
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  @Get()
  @ApiOkResponse()
  list() {
    return this.service.list();
  }

  @Get(":id")
  @ApiOkResponse()
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  @AdminAuth("attribute.create")
  @ApiCreatedResponse()
  create(@Body() dto: CreateAttributeDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @AdminAuth("attribute.edit")
  @ApiOkResponse()
  update(@Param("id") id: string, @Body() dto: UpdateAttributeDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AdminAuth("attribute.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/values")
  @AdminAuth("attribute.edit")
  @ApiCreatedResponse()
  addValue(@Param("id") id: string, @Body() dto: CreateAttributeValueDto) {
    return this.service.addValue(id, dto);
  }

  @Delete(":id/values/:valueId")
  @AdminAuth("attribute.edit")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeValue(@Param("id") id: string, @Param("valueId") valueId: string) {
    return this.service.removeValue(id, valueId);
  }
}
