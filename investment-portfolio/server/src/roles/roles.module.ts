import { Module } from "@nestjs/common";
import { RoleService } from "./roles.service";
import { RolesController } from "./roles.controller";
import { ApprovalModule } from "../approval/approval.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [ApprovalModule, AuditModule],
  controllers: [RolesController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RolesModule {}
