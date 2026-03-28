import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePortfolioAccountDto,
  UpdatePortfolioAccountDto,
} from "./dto/portfolio-account.dto";

@Injectable()
export class PortfolioAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.portfolioAccount.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: string) {
    const pa = await this.prisma.portfolioAccount.findUnique({ where: { id } });
    if (!pa) throw new NotFoundException("Portfolio account not found");
    return pa;
  }

  async create(dto: CreatePortfolioAccountDto) {
    return this.prisma.portfolioAccount.create({ data: dto });
  }

  async update(id: string, dto: UpdatePortfolioAccountDto) {
    await this.findOne(id);
    return this.prisma.portfolioAccount.update({ where: { id }, data: dto });
  }

  /** Returns all portfolio holdings with instrument info. */
  async getHoldings(_portfolioAccountId: string) {
    const holdings = await this.prisma.portfolioHolding.findMany({
      include: { instrument: true },
      orderBy: [{ companySymbol: "asc" }],
    });

    const totalValue = holdings.reduce((s, h) => {
      return (
        s + (h.marketValue ?? h.totalQuantity * (h.weightedAverageCost ?? 0))
      );
    }, 0);

    return { holdings, totalValue };
  }

  async getSummary(organizationId: string) {
    const accounts = await this.findAll(organizationId);
    const { holdings, totalValue } = await this.getHoldings("");
    return { accounts, holdings, totalValue };
  }
}
