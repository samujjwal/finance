import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeeRatesService } from "../fee-rates/fee-rates.service";
import { ApprovalService } from "../approval/approval.service";
import { AuditService } from "../audit/audit.service";
import { InvestmentAccountingBridgeService } from "../integration/investment-accounting-bridge.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilterDto,
  ApproveTransactionDto,
  SubmitForApprovalDto,
} from "./dto/transaction.dto";

// Transaction approval states
export enum TransactionStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private feeRates: FeeRatesService,
    private approvalService: ApprovalService,
    private auditService: AuditService,
    @Optional() private bridge?: InvestmentAccountingBridgeService,
  ) {}

  async findAll(filters?: TransactionFilterDto) {
    const where: any = {};

    if (filters?.companySymbol) {
      where.companySymbol = filters.companySymbol;
    }

    if (filters?.transactionType) {
      where.transactionType = filters.transactionType;
    }

    if (filters?.approvalStatus) {
      where.status = filters.approvalStatus;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.transactionDate = {};
      if (filters.dateFrom) {
        where.transactionDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.transactionDate.lte = filters.dateTo;
      }
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      include: {
        instrument: {
          select: {
            symbol: true,
            companyName: true,
            sector: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        instrument: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    return transaction;
  }

  async create(createDto: CreateTransactionDto) {
    // Validate that the company exists
    const company = await this.prisma.instrument.findUnique({
      where: { symbol: createDto.companySymbol },
    });

    if (!company) {
      throw new NotFoundException(
        `Company '${createDto.companySymbol}' not found`,
      );
    }

    // Auto-calculate totals if not provided
    const data: any = { ...createDto };
    if (createDto.transactionType === "BUY") {
      data.purchaseQuantity = createDto.purchaseQuantity || 0;
      data.salesQuantity = 0;
      if (
        !data.totalPurchaseAmount &&
        data.purchaseQuantity &&
        data.purchasePricePerUnit
      ) {
        data.totalPurchaseAmount =
          data.purchaseQuantity * data.purchasePricePerUnit;
      }
      // Auto-fill commission/charge fields when not provided by the client
      if (data.totalPurchaseAmount && !data.totalPurchaseCost) {
        const charges = await this.feeRates.calculateCharges(
          data.totalPurchaseAmount,
          false,
          company.instrumentType,
        );
        data.purchaseCommission = data.purchaseCommission ?? charges.brokerage;
        data.purchaseDpCharges = data.purchaseDpCharges ?? charges.dpCharge;
        data.totalPurchaseCommission =
          data.totalPurchaseCommission ?? charges.total;
        data.totalPurchaseCost =
          data.totalPurchaseAmount +
          (data.totalPurchaseCommission ?? charges.total);
      }
    } else {
      data.salesQuantity = createDto.salesQuantity || 0;
      data.purchaseQuantity = 0;
      if (
        !data.totalSalesAmount &&
        data.salesQuantity &&
        data.salesPricePerUnit
      ) {
        data.totalSalesAmount = data.salesQuantity * data.salesPricePerUnit;
      }
      // Auto-fill sales charge fields when not provided
      if (data.totalSalesAmount && !data.totalSalesCommission) {
        const charges = await this.feeRates.calculateCharges(
          data.totalSalesAmount,
          true,
          company.instrumentType,
        );
        data.salesCommission = data.salesCommission ?? charges.brokerage;
        data.salesDpCharges = data.salesDpCharges ?? charges.dpCharge;
        data.totalSalesCommission = data.totalSalesCommission ?? charges.total;
        if (!data.netReceivables) {
          data.netReceivables =
            data.totalSalesAmount -
            (data.totalSalesCommission ?? charges.total);
        }
      }
    }

    const saved = await this.prisma.transaction.create({
      data,
      include: {
        instrument: true,
      },
    });

    // Fire-and-forget: auto-journal if accounting is configured
    if (this.bridge) {
      const creator = await this.prisma.user.findUnique({
        where: { id: saved.createdBy },
        select: { organizationId: true },
      });
      const organizationId = creator?.organizationId;
      if (!organizationId) return saved;

      const isBuy = createDto.transactionType === "BUY";
      const amount = isBuy
        ? (saved.totalPurchaseAmount ?? 0)
        : (saved.totalSalesAmount ?? 0);
      const qty = isBuy
        ? (saved.purchaseQuantity ?? 0)
        : (saved.salesQuantity ?? 0);
      const price = isBuy
        ? (saved.purchasePricePerUnit ?? 0)
        : (saved.salesPricePerUnit ?? 0);
      void this.bridge.createJournalForTransaction({
        organizationId,
        transactionId: saved.id,
        instrumentSymbol: saved.companySymbol,
        transactionType: createDto.transactionType as any,
        quantity: qty,
        pricePerUnit: price,
        totalAmount: amount,
        brokerageCommission: isBuy
          ? (saved.purchaseCommission ?? 0)
          : (saved.salesCommission ?? 0),
        sebonFee: 0,
        dpCharge: isBuy
          ? (saved.purchaseDpCharges ?? 0)
          : (saved.salesDpCharges ?? 0),
        transactionDate: new Date(saved.transactionDate),
        createdById: saved.createdBy,
      });
    }

    return saved;
  }

  async update(id: string, updateDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id);

    // If updating company symbol, validate it exists
    if (
      updateDto.companySymbol &&
      updateDto.companySymbol !== transaction.companySymbol
    ) {
      const company = await this.prisma.instrument.findUnique({
        where: { symbol: updateDto.companySymbol },
      });

      if (!company) {
        throw new NotFoundException(
          `Company '${updateDto.companySymbol}' not found`,
        );
      }
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateDto,
      include: {
        instrument: true,
      },
    });
  }

  async remove(id: string, userId?: string) {
    const transaction = await this.findOne(id);

    // Only allow deletion of DRAFT or REJECTED transactions
    if (transaction.status === TransactionStatus.APPROVED) {
      throw new ForbiddenException(
        "Cannot delete approved transactions. Please create a reversal transaction instead.",
      );
    }
    if (transaction.status === TransactionStatus.PENDING) {
      throw new ForbiddenException(
        "Cannot delete pending transactions. Please withdraw from approval first.",
      );
    }

    // Audit log the deletion
    if (userId) {
      await this.auditService.log({
        action: "DELETE",
        entityType: "Transaction",
        entityId: id,
        userId,
        comment: `Deleted transaction for ${transaction.companySymbol}`,
        oldValues: transaction,
      });
    }

    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  /**
   * Submit transaction for approval
   */
  async submitForApproval(
    id: string,
    userId: string,
    dto?: SubmitForApprovalDto,
  ) {
    const transaction = await this.findOne(id);

    // Validate current status
    if (transaction.status === TransactionStatus.PENDING) {
      throw new BadRequestException("Transaction is already pending approval");
    }
    if (transaction.status === TransactionStatus.APPROVED) {
      throw new BadRequestException("Transaction is already approved");
    }

    // Create approval workflow
    const workflow = await this.approvalService.createWorkflow({
      entityType: "TRANSACTION",
      entityId: id,
      action:
        dto?.notes ||
        `Submit transaction for approval: ${transaction.transactionType} ${transaction.companySymbol}`,
      requestedBy: userId,
    });

    // Update transaction status
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { status: TransactionStatus.PENDING },
      include: { instrument: true },
    });

    // Audit log
    await this.auditService.log({
      action: "SUBMIT_FOR_APPROVAL",
      entityType: "Transaction",
      entityId: id,
      userId,
      comment: `Submitted transaction for approval: ${transaction.transactionType} ${transaction.companySymbol}`,
    });

    return { transaction: updated, workflow };
  }

  /**
   * Approve a transaction
   */
  async approveTransaction(
    id: string,
    approverId: string,
    dto?: ApproveTransactionDto,
  ) {
    const transaction = await this.findOne(id);

    // Validate current status
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException("Transaction is not pending approval");
    }

    // Find and approve the workflow
    const workflows = await this.approvalService.getWorkflowsForEntity(
      "TRANSACTION",
      id,
    );
    const workflow = workflows?.[0];
    if (!workflow) {
      throw new NotFoundException("Approval workflow not found");
    }

    const approvedWorkflow = await this.approvalService.approveWorkflow({
      workflowId: workflow.id,
      approvedBy: approverId,
    });

    // Update transaction status
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: approverId,
      },
      include: { instrument: true },
    });

    // Audit log
    await this.auditService.log({
      action: "APPROVE",
      entityType: "Transaction",
      entityId: id,
      userId: approverId,
      comment: `Approved transaction: ${transaction.transactionType} ${transaction.companySymbol}`,
    });

    return { transaction: updated, workflow: approvedWorkflow };
  }

  /**
   * Reject a transaction
   */
  async rejectTransaction(
    id: string,
    approverId: string,
    dto: ApproveTransactionDto,
  ) {
    if (!dto.rejectionReason) {
      throw new BadRequestException("Rejection reason is required");
    }

    const transaction = await this.findOne(id);

    // Validate current status
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException("Transaction is not pending approval");
    }

    // Find and reject the workflow
    const workflows = await this.approvalService.getWorkflowsForEntity(
      "TRANSACTION",
      id,
    );
    const workflow = workflows?.[0];
    if (!workflow) {
      throw new NotFoundException("Approval workflow not found");
    }

    const rejectedWorkflow = await this.approvalService.rejectWorkflow({
      workflowId: workflow.id,
      approvedBy: approverId,
      rejectionReason: dto.rejectionReason,
    });

    // Update transaction status
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.REJECTED,
      },
      include: { instrument: true },
    });

    // Audit log
    await this.auditService.log({
      action: "REJECT",
      entityType: "Transaction",
      entityId: id,
      userId: approverId,
      comment: `Rejected transaction: ${transaction.transactionType} ${transaction.companySymbol}`,
      newValues: { status: TransactionStatus.REJECTED },
    });

    return { transaction: updated, workflow: rejectedWorkflow };
  }

  /**
   * Withdraw transaction from approval
   */
  async withdrawFromApproval(id: string, userId: string) {
    const transaction = await this.findOne(id);

    // Validate current status
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException("Transaction is not pending approval");
    }

    // Find and delete the workflow (no cancel method available)
    const workflows = await this.approvalService.getWorkflowsForEntity(
      "TRANSACTION",
      id,
    );
    const workflow = workflows?.[0];
    if (workflow) {
      await this.prisma.approvalWorkflow.delete({ where: { id: workflow.id } });
    }

    // Update transaction status back to DRAFT
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { status: TransactionStatus.DRAFT },
      include: { instrument: true },
    });

    // Audit log
    await this.auditService.log({
      action: "WITHDRAW",
      entityType: "Transaction",
      entityId: id,
      userId,
      comment: `Withdrawn transaction from approval: ${transaction.transactionType} ${transaction.companySymbol}`,
    });

    return updated;
  }

  /**
   * Get transactions pending approval
   */
  async getPendingApprovals() {
    return this.prisma.transaction.findMany({
      where: { status: TransactionStatus.PENDING },
      include: { instrument: true },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get transaction approval statistics
   */
  async getApprovalStats() {
    const [total, draft, pending, approved, rejected] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({
        where: { status: TransactionStatus.DRAFT },
      }),
      this.prisma.transaction.count({
        where: { status: TransactionStatus.PENDING },
      }),
      this.prisma.transaction.count({
        where: { status: TransactionStatus.APPROVED },
      }),
      this.prisma.transaction.count({
        where: { status: TransactionStatus.REJECTED },
      }),
    ]);

    return {
      total,
      draft,
      pending,
      approved,
      rejected,
    };
  }
}
