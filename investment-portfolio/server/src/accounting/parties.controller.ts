import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CustomersService, VendorsService } from "./parties.service";
import { CreatePartyDto, UpdatePartyDto } from "./dto/commercial.dto";

@ApiTags("Accounting - Customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/customers")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  findAll(@Query("organizationId") organizationId: string) {
    return this.customers.findAll(organizationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.customers.findOne(id);
  }

  @Get(":id/balance")
  getBalance(@Param("id") id: string) {
    return this.customers.getBalance(id);
  }

  @Get(":id/statement")
  @ApiOperation({ summary: "Get customer account statement" })
  getStatement(
    @Param("id") id: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.customers.getStatement(
      id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Post()
  create(@Body() dto: CreatePartyDto) {
    return this.customers.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePartyDto) {
    return this.customers.update(id, dto);
  }
}

@ApiTags("Accounting - Vendors")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/vendors")
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  findAll(@Query("organizationId") organizationId: string) {
    return this.vendors.findAll(organizationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vendors.findOne(id);
  }

  @Get(":id/balance")
  getBalance(@Param("id") id: string) {
    return this.vendors.getBalance(id);
  }

  @Post()
  create(@Body() dto: CreatePartyDto) {
    return this.vendors.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePartyDto) {
    return this.vendors.update(id, dto);
  }
}
