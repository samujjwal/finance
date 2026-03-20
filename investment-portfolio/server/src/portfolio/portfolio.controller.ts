import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';

@ApiTags('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('holdings')
  @ApiOperation({ summary: 'Get portfolio holdings' })
  async getHoldings() {
    return {
      success: true,
      data: await this.portfolioService.getHoldings(),
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get portfolio summary' })
  async getSummary() {
    return {
      success: true,
      data: await this.portfolioService.getSummary(),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get portfolio statistics' })
  async getStats() {
    return {
      success: true,
      data: await this.portfolioService.getStats(),
    };
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate portfolio holdings' })
  async recalculate() {
    return {
      success: true,
      data: await this.portfolioService.recalculate(),
    };
  }
}
