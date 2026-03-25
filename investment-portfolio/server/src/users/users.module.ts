import { Module } from "@nestjs/common";
import { UserService } from "./users.service";
import { UsersController } from "./users.controller";
import { ApprovalModule } from "../approval/approval.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [ApprovalModule, AuditModule],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
