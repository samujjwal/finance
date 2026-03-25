import { Controller, Get, Query, UseGuards, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("audit")
@Controller("audit")
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get("logs")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get audit logs with filters" })
  async getLogs(
    @Query("entityType") entityType?: string,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const logs = await this.auditService.getLogsWithFilters({
      entityType,
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return { success: true, data: logs };
  }

  @Get("recent")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get recent audit logs" })
  async getRecentLogs(@Query("limit") limit: string = "50") {
    const logs = await this.auditService.getRecentLogs(parseInt(limit, 10));
    return { success: true, data: logs };
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get audit statistics" })
  async getAuditStats() {
    const stats = await this.auditService.getAuditStats();
    return { success: true, data: stats };
  }

  @Get("entity/:entityType/:entityId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get audit logs for a specific entity" })
  async getLogsForEntity(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
  ) {
    const logs = await this.auditService.getLogsForEntity(entityType, entityId);
    return { success: true, data: logs };
  }
}
