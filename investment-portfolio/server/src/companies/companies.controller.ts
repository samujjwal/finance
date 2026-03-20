import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@ApiTags('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  async findAll() {
    return {
      success: true,
      data: await this.companiesService.findAll(),
    };
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get company by symbol' })
  async findOne(@Param('symbol') symbol: string) {
    return {
      success: true,
      data: await this.companiesService.findOne(symbol),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new company' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return {
      success: true,
      data: await this.companiesService.create(createCompanyDto),
    };
  }

  @Put(':symbol')
  @ApiOperation({ summary: 'Update company' })
  async update(@Param('symbol') symbol: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return {
      success: true,
      data: await this.companiesService.update(symbol, updateCompanyDto),
    };
  }

  @Delete(':symbol')
  @ApiOperation({ summary: 'Delete company' })
  async remove(@Param('symbol') symbol: string) {
    await this.companiesService.remove(symbol);
    return {
      success: true,
      message: 'Company deleted successfully',
    };
  }
}
