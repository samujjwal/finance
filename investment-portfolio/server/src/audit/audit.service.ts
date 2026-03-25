import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  comment?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        comment: entry.comment,
      },
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async getLogsForEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Get audit logs by user
   */
  async getLogsByUser(userId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit: number = 50) {
    return this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs by action type
   */
  async getLogsByAction(action: string) {
    return this.prisma.auditLog.findMany({
      where: {
        action,
      },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Get audit logs with filters
   */
  async getLogsWithFilters(filters: {
    entityType?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats() {
    const [
      totalLogs,
      todayLogs,
      createActions,
      updateActions,
      deleteActions,
      approveActions,
      rejectActions,
    ] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.auditLog.count({ where: { action: 'CREATE' } }),
      this.prisma.auditLog.count({ where: { action: 'MODIFY' } }),
      this.prisma.auditLog.count({ where: { action: 'DELETE' } }),
      this.prisma.auditLog.count({ where: { action: 'APPROVE' } }),
      this.prisma.auditLog.count({ where: { action: 'REJECT' } }),
    ]);

    return {
      totalLogs,
      todayLogs,
      actionBreakdown: {
        create: createActions,
        modify: updateActions,
        delete: deleteActions,
        approve: approveActions,
        reject: rejectActions,
      },
    };
  }
}
