import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateModuleAccessDto,
} from "./dto/organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.organization.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  async findByCode(code: string) {
    const org = await this.prisma.organization.findUnique({ where: { code } });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException("Organization code already exists");
    return this.prisma.organization.create({ data: dto });
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  /** Toggle module access flags. Deactivating accounting is irreversible once books exist. */
  async updateModuleAccess(id: string, dto: UpdateModuleAccessDto) {
    const org = await this.findOne(id);

    // Guard: if trying to disable accounting, ensure no journal entries exist
    if (dto.hasAccounting === false && org.hasAccounting) {
      const journalCount = await this.prisma.journalEntry.count({
        where: { organizationId: id },
      });
      if (journalCount > 0) {
        throw new BadRequestException(
          "Cannot deactivate accounting module: journal entries already exist",
        );
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.hasInvestment !== undefined && {
          hasInvestment: dto.hasInvestment,
        }),
        ...(dto.hasAccounting !== undefined && {
          hasAccounting: dto.hasAccounting,
        }),
        ...(dto.hasInventory !== undefined && {
          hasInventory: dto.hasInventory,
        }),
      },
    });
  }

  /** Returns the active module flags for an organization. */
  async getModules(id: string) {
    const org = await this.findOne(id);
    return {
      hasInvestment: org.hasInvestment,
      hasAccounting: org.hasAccounting,
      hasInventory: org.hasInventory,
    };
  }

  /** Ensure the org has the required module enabled — throws if not. */
  async validateModuleAccess(
    id: string,
    moduleName: "investment" | "accounting" | "inventory",
  ) {
    const org = await this.findOne(id);
    const map = {
      investment: org.hasInvestment,
      accounting: org.hasAccounting,
      inventory: org.hasInventory,
    };
    if (!map[moduleName]) {
      throw new BadRequestException(
        `Module '${moduleName}' is not activated for this organization`,
      );
    }
  }
}
