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
import { InvoicesService, BillsService } from "./documents.service";
import { CreateInvoiceDto, CreateBillDto } from "./dto/commercial.dto";

@ApiTags("Accounting - Invoices (AR)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/invoices")
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  findAll(
    @Query("organizationId") organizationId: string,
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.invoices.findAll(organizationId, {
      ...(status && { status }),
      ...(customerId && { customerId }),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.invoices.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    const createdBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.invoices.create(dto, createdBy);
  }

  @Put(":id/post")
  @ApiOperation({ summary: "Post invoice and create AR journal entry" })
  post(@Param("id") id: string, @Req() req: any) {
    const postedBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.invoices.post(id, postedBy);
  }

  @Put(":id/payment")
  @ApiOperation({ summary: "Apply a payment to the invoice" })
  applyPayment(@Param("id") id: string, @Body() body: { amount: number }) {
    return this.invoices.applyPayment(id, body.amount);
  }
}

@ApiTags("Accounting - Bills (AP)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/bills")
export class BillsController {
  constructor(private readonly bills: BillsService) {}

  @Get()
  findAll(
    @Query("organizationId") organizationId: string,
    @Query("status") status?: string,
    @Query("vendorId") vendorId?: string,
  ) {
    return this.bills.findAll(organizationId, {
      ...(status && { status }),
      ...(vendorId && { vendorId }),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.bills.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBillDto, @Req() req: any) {
    const createdBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.bills.create(dto, createdBy);
  }

  @Put(":id/post")
  @ApiOperation({ summary: "Post bill and create AP journal entry" })
  post(@Param("id") id: string, @Req() req: any) {
    const postedBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.bills.post(id, postedBy);
  }
}
