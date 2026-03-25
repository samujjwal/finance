import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('approvals')
@Controller('approvals')
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending approval workflows' })
  async getPendingWorkflows() {
    const workflows = await this.approvalService.getPendingWorkflows();
    return { success: true, data: workflows };
  }

  @Get('by-entity-type')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending workflows grouped by entity type' })
  async getPendingByEntityType() {
    const workflows = await this.approvalService.getPendingWorkflowsByEntityType();
    return { success: true, data: workflows };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workflow statistics' })
  async getWorkflowStats() {
    const stats = await this.approvalService.getWorkflowStats();
    return { success: true, data: stats };
  }

  @Get(':entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workflows for a specific entity' })
  async getWorkflowsForEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const workflows = await this.approvalService.getWorkflowsForEntity(entityType, entityId);
    return { success: true, data: workflows };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a workflow' })
  async approveWorkflow(@Param('id') id: string, @Request() req) {
    const workflow = await this.approvalService.approveWorkflow({
      workflowId: id,
      approvedBy: req.user.sub,
    });
    return { success: true, data: workflow };
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a workflow' })
  async rejectWorkflow(
    @Param('id') id: string,
    @Body() dto: { rejectionReason: string },
    @Request() req,
  ) {
    const workflow = await this.approvalService.rejectWorkflow({
      workflowId: id,
      approvedBy: req.user.sub,
      rejectionReason: dto.rejectionReason,
    });
    return { success: true, data: workflow };
  }
}
