import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVoucherDto } from "./dto/accounting.dto";
import { JournalsService } from "./journals.service";

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalsService: JournalsService,
  ) {}

  async findAll(
    organizationId: string,
    voucherType: string,
    filters?: { status?: string },
  ) {
    return this.prisma.voucher.findMany({
      where: {
        organizationId,
        voucherType,
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { voucherDate: "desc" },
    });
  }

  async findOne(id: string) {
    const v = await this.prisma.voucher.findUnique({ where: { id } });
    if (!v) throw new NotFoundException("Voucher not found");
    return v;
  }

  async getNextVoucherNumber(
    organizationId: string,
    voucherType: string,
    fiscalYear?: string,
  ): Promise<string> {
    const prefix = `${fiscalYear ?? "GEN"}-${voucherType.substring(0, 3).toUpperCase()}-`;
    const last = await this.prisma.voucher.findFirst({
      where: {
        organizationId,
        voucherType,
        voucherNumber: { startsWith: prefix },
      },
      orderBy: { voucherNumber: "desc" },
    });
    const seqNum = last
      ? parseInt(last.voucherNumber.replace(prefix, "")) + 1
      : 1;
    return `${prefix}${String(seqNum).padStart(5, "0")}`;
  }

  async create(dto: CreateVoucherDto, createdBy: string) {
    const voucherNumber = await this.getNextVoucherNumber(
      dto.organizationId,
      dto.voucherType,
    );

    return this.prisma.voucher.create({
      data: {
        organizationId: dto.organizationId,
        voucherType: dto.voucherType,
        voucherNumber,
        fiscalYearId: dto.fiscalYearId,
        voucherDate: new Date(dto.voucherDate),
        narration: dto.narration,
        totalAmount: dto.totalAmount ?? 0,
        status: "DRAFT",
        createdBy,
      },
    });
  }

  async submitForApproval(id: string, submittedBy: string) {
    const v = await this.findOne(id);
    if (v.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT vouchers can be submitted");
    return this.prisma.voucher.update({
      where: { id },
      data: { status: "PENDING_APPROVAL", submittedBy },
    });
  }

  async approve(
    id: string,
    approvedBy: string,
    approved: boolean,
    reason?: string,
  ) {
    const v = await this.findOne(id);
    if (v.status !== "PENDING_APPROVAL") {
      throw new BadRequestException(
        "Only PENDING_APPROVAL vouchers can be approved/rejected",
      );
    }
    return this.prisma.voucher.update({
      where: { id },
      data: approved
        ? { status: "APPROVED", approvedBy, approvedAt: new Date() }
        : { status: "DRAFT", rejectionReason: reason },
    });
  }
}
