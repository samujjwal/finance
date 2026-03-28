import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto/company.dto";

@ApiTags("instruments")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("instruments")
export class InstrumentsController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: "Get all instruments" })
  async findAll() {
    return { success: true, data: await this.service.findAll() };
  }

  @Get(":symbol")
  @ApiOperation({ summary: "Get instrument by symbol" })
  async findOne(@Param("symbol") symbol: string) {
    return { success: true, data: await this.service.findOne(symbol) };
  }

  @Post()
  @ApiOperation({ summary: "Create instrument" })
  async create(@Body() dto: CreateCompanyDto) {
    return { success: true, data: await this.service.create(dto) };
  }

  @Put(":symbol")
  @ApiOperation({ summary: "Update instrument" })
  async update(@Param("symbol") symbol: string, @Body() dto: UpdateCompanyDto) {
    return { success: true, data: await this.service.update(symbol, dto) };
  }

  @Delete(":symbol")
  @ApiOperation({ summary: "Delete instrument" })
  async remove(@Param("symbol") symbol: string) {
    await this.service.remove(symbol);
    return { success: true, message: "Instrument deleted successfully" };
  }
}
