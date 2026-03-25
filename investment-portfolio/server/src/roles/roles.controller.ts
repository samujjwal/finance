import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private roleService: RoleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all roles with pagination and filtering' })
  async getRoles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('userTypeId') userTypeId?: string,
    @Query('isSystem') isSystem?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.roleService.getRoles(
      {
        status,
        userTypeId,
        isSystem: isSystem ? isSystem === 'true' : undefined,
        search,
      },
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return { success: true, data: result };
  }

  @Get('functions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available functions' })
  async getFunctions() {
    const functions = await this.roleService.getAllFunctions();
    return { success: true, data: functions };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get role by ID' })
  async getRoleById(@Param('id') id: string) {
    const role = await this.roleService.getRoleById(id);
    return { success: true, data: role };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new role (requires approval)' })
  async createRole(@Body() dto: any, @Request() req) {
    const role = await this.roleService.createRole(dto, req.user.sub);
    return { success: true, data: role };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject role' })
  async approveRole(
    @Param('id') id: string,
    @Body() dto: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string },
    @Request() req,
  ) {
    const role = await this.roleService.approveRole(
      id,
      req.user.sub,
      dto.action === 'REJECT' ? dto.rejectionReason : undefined,
    );
    return { success: true, data: role };
  }

  @Post(':id/functions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign functions to role (requires approval)' })
  async assignFunctions(
    @Param('id') id: string,
    @Body() dto: { functionIds: string[] },
    @Request() req,
  ) {
    const result = await this.roleService.assignFunctions(id, {
      functionIds: dto.functionIds,
      assignedBy: req.user.sub,
    });
    return { success: true, data: result };
  }

  @Post(':id/functions/:functionId/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove function from role' })
  async removeFunction(
    @Param('id') id: string,
    @Param('functionId') functionId: string,
    @Request() req,
  ) {
    const result = await this.roleService.removeFunction(id, functionId, req.user.sub);
    return { success: true, data: result };
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend role' })
  async suspendRole(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @Request() req,
  ) {
    const role = await this.roleService.suspendRole(id, dto.reason, req.user.sub);
    return { success: true, data: role };
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete role (only PENDING, REJECTED, or INACTIVE)' })
  async deleteRole(@Param('id') id: string, @Request() req) {
    const result = await this.roleService.deleteRole(id, req.user.sub);
    return { success: true, data: result };
  }

  @Post('assign-to-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to user (requires approval)' })
  async assignRoleToUser(
    @Body() dto: { userId: string; roleId: string; effectiveFrom?: Date; effectiveTo?: Date },
    @Request() req,
  ) {
    const result = await this.roleService.assignRoleToUser(
      dto.userId,
      dto.roleId,
      req.user.sub,
      dto.effectiveFrom,
      dto.effectiveTo,
    );
    return { success: true, data: result };
  }

  @Post('remove-from-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRoleFromUser(
    @Body() dto: { userId: string; roleId: string },
    @Request() req,
  ) {
    const result = await this.roleService.removeRoleFromUser(dto.userId, dto.roleId, req.user.sub);
    return { success: true, data: result };
  }

  @Get('user/:userId/functions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all functions assigned to a user' })
  async getUserFunctions(@Param('userId') userId: string) {
    const functions = await this.roleService.getUserFunctions(userId);
    return { success: true, data: functions };
  }
}
