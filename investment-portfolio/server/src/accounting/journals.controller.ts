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
import { JournalsService } from "./journals.service";
import { CreateJournalEntryDto } from "./dto/accounting.dto";

@ApiTags("Accounting - Journals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/journals")
export class JournalsController {
  constructor(private readonly journals: JournalsService) {}

  @Get()
  @ApiOperation({ summary: "List journal entries" })
  findAll(
    @Query("organizationId") organizationId: string,
    @Query("fiscalYearId") fiscalYearId?: string,
    @Query("status") status?: string,
  ) {
    return this.journals.findAll(organizationId, {
      ...(fiscalYearId && { fiscalYearId }),
      ...(status && { status }),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.journals.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJournalEntryDto, @Req() req: any) {
    const createdBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.journals.create(dto, createdBy);
  }

  @Put(":id/post")
  @ApiOperation({ summary: "Post (finalize) a draft journal entry" })
  post(@Param("id") id: string, @Req() req: any) {
    const postedBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.journals.post(id, postedBy);
  }

  @Post(":id/reverse")
  @ApiOperation({ summary: "Create a reversal journal entry" })
  reverse(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const createdBy: string = req.user?.userId ?? req.user?.id ?? "SYSTEM";
    return this.journals.reverse(
      id,
      body.reason ?? "Manual reversal",
      createdBy,
    );
  }
}
