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
    const totalUsers = await this.prisma.user.count();
    const hasSetup = totalUsers > 0;
    return {
      success: true,
      data: {
        firstRun: !hasSetup,
        userCount: totalUsers,
      },
    };
  }

  @Post("login")
  @ApiOperation({ summary: "Login user" })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const forwardedFor = req.headers["x-forwarded-for"] as string | undefined;
    const ipAddress =
      (forwardedFor ? forwardedFor.split(",")[0].trim() : undefined) || req.ip;

    return {
      success: true,
      data: await this.authService.login(
        loginDto.username,
        loginDto.password,
        ipAddress,
        req.headers["user-agent"],
        loginDto.totpCode,
      ),
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
  async logout(@Request() req: any) {
    await this.authService.logout(req.user?.sub, req.user?.sid);
    return {
      success: true,
      message: "Logout successful",
    };
  }
}
