import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('userTypeId') userTypeId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.userService.getUsers(
      { status, branchId, userTypeId, search },
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return { success: true, data: user };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user (requires approval)' })
  async createUser(@Body() dto: any, @Request() req) {
    const user = await this.userService.createUser(dto, req.user.sub);
    return { success: true, data: user };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject user' })
  async approveUser(
    @Param('id') id: string,
    @Body() dto: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string },
    @Request() req,
  ) {
    const user = await this.userService.approveUser(
      id,
      req.user.sub,
      dto.action === 'REJECT' ? dto.rejectionReason : undefined,
    );
    return { success: true, data: user };
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @Request() req,
  ) {
    const user = await this.userService.suspendUser(id, {
      reason: dto.reason,
      suspendedBy: req.user.sub,
    });
    return { success: true, data: user };
  }

  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request user reactivation (requires approval)' })
  async reactivateUser(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @Request() req,
  ) {
    const user = await this.userService.reactivateUser(id, dto.reason, req.user.sub);
    return { success: true, data: user };
  }

  @Post(':id/unlock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock locked user account' })
  async unlockUser(
    @Param('id') id: string,
    @Body() dto: { reason?: string },
    @Request() req,
  ) {
    const user = await this.userService.unlockUser(id, req.user.sub, dto.reason);
    return { success: true, data: user };
  }

  @Get('locked/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all locked users' })
  async getLockedUsers() {
    const users = await this.userService.getLockedUsers();
    return { success: true, data: users };
  }
}
