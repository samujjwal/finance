import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VouchersService } from "./vouchers.service";
import { CreateVoucherDto } from "./dto/accounting.dto";

@ApiTags("Accounting - Vouchers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/vouchers")
export class VouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Get()
  @ApiOperation({ summary: "List vouchers for an organization" })
  findAll(
    @Query("organizationId") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.vouchers.findAll(organizationId, status);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vouchers.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVoucherDto, @Req() req: any) {
    const createdBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.vouchers.create(dto, createdBy);
  }

  @Put(":id/submit")
  @ApiOperation({ summary: "Submit voucher for approval" })
  submit(@Param("id") id: string, @Req() req: any) {
    const submittedBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.vouchers.submitForApproval(id, submittedBy);
  }

  @Put(":id/approve")
  @ApiOperation({ summary: "Approve or reject a voucher" })
  approve(
    @Param("id") id: string,
    @Body() body: { approverId: string; approve: boolean; remarks?: string },
    @Req() req: any,
  ) {
    const approverId: string =
      body.approverId ?? req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.vouchers.approve(id, approverId, body.approve, body.remarks);
  }
}
