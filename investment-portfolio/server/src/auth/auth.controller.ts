import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  /**
   * Unauthenticated endpoint – called by the frontend before the login screen
   * to decide whether to show the first-run setup wizard.
   *
   * firstRun = true  → only root/system user exists; invite the human operator
   *                    to create their own account.
   * firstRun = false → at least one non-ROOT user exists; show login form.
   */
  @Get("setup-status")
  @ApiOperation({
    summary: "Check whether the application needs first-run setup",
  })
  async getSetupStatus() {
    const nonRootCount = await this.prisma.user.count({
      where: { role: { not: "ROOT" } },
    });
    return {
      success: true,
      data: {
        firstRun: nonRootCount === 0,
        userCount: nonRootCount,
      },
    };
  }

  @Post("login")
  @ApiOperation({ summary: "Login user" })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return {
      success: true,
      data: await this.authService.login(loginDto.username, loginDto.password),
    };
  }

  @Post("register")
  @ApiOperation({ summary: "Register new user" })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return {
      success: true,
      data: await this.authService.register(registerDto),
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user" })
  async getCurrentUser(@Request() req) {
    return {
      success: true,
      data: await this.authService.getCurrentUser(req.user.sub),
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout user" })
  async logout() {
    return {
      success: true,
      message: "Logout successful",
    };
  }
}
