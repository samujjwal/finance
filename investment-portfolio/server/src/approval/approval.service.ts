import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

export interface CreateWorkflowDto {
  entityType: string;
  entityId: string;
  action: string;
  requestedBy: string;
  comment?: string;
}

export interface ApproveWorkflowDto {
  workflowId: string;
  approvedBy: string;
  rejectionReason?: string;
}

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new approval workflow for an entity operation
   */
  async createWorkflow(dto: CreateWorkflowDto) {
    // Check if there's already a pending workflow for this entity
    const existingWorkflow = await this.prisma.approvalWorkflow.findFirst({
      where: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        status: "PENDING",
      },
    });

    if (existingWorkflow) {
      throw new BadRequestException(
        `A pending approval workflow already exists for this ${dto.entityType.toLowerCase()}`,
      );
    }

    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action,
        requestedBy: dto.requestedBy,
        status: "PENDING",
      },
    });

    // Log the creation in audit trail
    await this.auditService.log({
      entityType: "APPROVAL_WORKFLOW",
      entityId: workflow.id,
      action: "CREATE",
      newValues: workflow,
      userId: dto.requestedBy,
      comment: dto.comment,
    });

    return workflow;
  }

  /**
   * Get all pending workflows
   */
  async getPendingWorkflows() {
    return this.prisma.approvalWorkflow.findMany({
      where: { status: "PENDING" },
      include: {
        requester: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });
  }

  /**
   * Get workflows for a specific entity
   */
  async getWorkflowsForEntity(entityType: string, entityId: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        requester: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
        approver: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });
  }

  /**
   * Approve a workflow
   */
  async approveWorkflow(dto: ApproveWorkflowDto) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: dto.workflowId },
    });

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }

    if (workflow.status !== "PENDING") {
      throw new BadRequestException(
        `Workflow is already ${workflow.status.toLowerCase()}`,
      );
    }

    // Cannot approve your own request (unless user is admin)
    if (workflow.requestedBy === dto.approvedBy) {
      // Check if the user is an admin
      const user = await this.prisma.user.findUnique({
        where: { id: dto.approvedBy },
        include: { userType: true },
      });

      const isAdmin =
        user?.userType?.id === "ADMIN" || user?.userType?.id === "SUPER_ADMIN";

      if (!isAdmin) {
        throw new BadRequestException("You cannot approve your own request");
      }
      // Admin users can approve their own requests - continue with approval
    }

    const oldValues = { ...workflow };

    const updatedWorkflow = await this.prisma.approvalWorkflow.update({
      where: { id: dto.workflowId },
      data: {
        status: "APPROVED",
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
      },
    });

    // Log the approval in audit trail
    await this.auditService.log({
      entityType: "APPROVAL_WORKFLOW",
      entityId: workflow.id,
      action: "APPROVE",
      oldValues,
      newValues: updatedWorkflow,
      userId: dto.approvedBy,
    });

    return updatedWorkflow;
  }

  /**
   * Reject a workflow
   */
  async rejectWorkflow(dto: ApproveWorkflowDto) {
    if (!dto.rejectionReason || dto.rejectionReason.trim().length === 0) {
      throw new BadRequestException("Rejection reason is required");
    }

    if (dto.rejectionReason.length > 2500) {
      throw new BadRequestException(
        "Rejection reason must not exceed 2500 characters",
      );
    }

    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: dto.workflowId },
    });

    if (!workflow) {
      throw new NotFoundException("Workflow not found");
    }

    if (workflow.status !== "PENDING") {
      throw new BadRequestException(
        `Workflow is already ${workflow.status.toLowerCase()}`,
      );
    }

    // Cannot reject your own request
    if (workflow.requestedBy === dto.approvedBy) {
      throw new BadRequestException("You cannot reject your own request");
    }

    const oldValues = { ...workflow };

    const updatedWorkflow = await this.prisma.approvalWorkflow.update({
      where: { id: dto.workflowId },
      data: {
        status: "REJECTED",
        approvedBy: dto.approvedBy,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    // Log the rejection in audit trail
    await this.auditService.log({
      entityType: "APPROVAL_WORKFLOW",
      entityId: workflow.id,
      action: "REJECT",
      oldValues,
      newValues: updatedWorkflow,
      userId: dto.approvedBy,
      comment: dto.rejectionReason,
    });

    return updatedWorkflow;
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats() {
    const [totalPending, totalApproved, totalRejected, todayPending] =
      await Promise.all([
        this.prisma.approvalWorkflow.count({ where: { status: "PENDING" } }),
        this.prisma.approvalWorkflow.count({ where: { status: "APPROVED" } }),
        this.prisma.approvalWorkflow.count({ where: { status: "REJECTED" } }),
        this.prisma.approvalWorkflow.count({
          where: {
            status: "PENDING",
            requestedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return {
      totalPending,
      totalApproved,
      totalRejected,
      todayPending,
      total: totalPending + totalApproved + totalRejected,
    };
  }

  /**
   * Check if an entity has a pending workflow
   */
  async hasPendingWorkflow(
    entityType: string,
    entityId: string,
  ): Promise<boolean> {
    const count = await this.prisma.approvalWorkflow.count({
      where: {
        entityType,
        entityId,
        status: "PENDING",
      },
    });
    return count > 0;
  }

  /**
   * Get pending workflows grouped by entity type
   */
  async getPendingWorkflowsByEntityType() {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: { status: "PENDING" },
      include: {
        requester: {
          select: {
            id: true,
            userId: true,
            username: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    // Group by entity type
    const grouped = workflows.reduce(
      (acc, workflow) => {
        const type = workflow.entityType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(workflow);
        return acc;
      },
      {} as Record<string, typeof workflows>,
    );

    return grouped;
  }
}
