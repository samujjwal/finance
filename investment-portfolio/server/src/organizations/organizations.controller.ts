import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrganizationsService } from "./organizations.service";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateModuleAccessDto,
} from "./dto/organization.dto";

@ApiTags("organizations")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: "List all organizations" })
  async findAll() {
    return { success: true, data: await this.service.findAll() };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get organization by id" })
  async findOne(@Param("id") id: string) {
    return { success: true, data: await this.service.findOne(id) };
  }

  @Get(":id/modules")
  @ApiOperation({ summary: "Get active modules for organization" })
  async getModules(@Param("id") id: string) {
    return { success: true, data: await this.service.getModules(id) };
  }

  @Post()
  @ApiOperation({ summary: "Create organization" })
  async create(@Body() dto: CreateOrganizationDto) {
    return { success: true, data: await this.service.create(dto) };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update organization details" })
  async update(@Param("id") id: string, @Body() dto: UpdateOrganizationDto) {
    return { success: true, data: await this.service.update(id, dto) };
  }

  @Put(":id/modules")
  @ApiOperation({ summary: "Update module access flags" })
  async updateModules(
    @Param("id") id: string,
    @Body() dto: UpdateModuleAccessDto,
  ) {
    return {
      success: true,
      data: await this.service.updateModuleAccess(id, dto),
    };
  }
}
