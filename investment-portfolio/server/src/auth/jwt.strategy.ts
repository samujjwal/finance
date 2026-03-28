import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET") || "your-secret-key",
    });
  }

  async validate(payload: any) {
    if (!payload.sid) {
      throw new UnauthorizedException("Session is missing");
    }

    const activeSession = await this.prisma.userSession.findFirst({
      where: {
        userId: payload.sub,
        token: payload.sid,
        expiresAt: { gt: new Date() },
      },
    });

    if (!activeSession) {
      throw new UnauthorizedException("Session expired or invalid");
    }

    // Extend session on each validated request to enforce idle-timeout semantics.
    await this.prisma.userSession.update({
      where: { id: activeSession.id },
      data: { expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });

    // Fetch user with active roles for RBAC
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        firstName: true,
        surname: true,
        status: true,
        isActive: true,
        userTypeId: true,
      },
    });

    if (!user || !user.isActive || user.status !== "ACTIVE") {
      throw new UnauthorizedException("User account is not active");
    }

    return {
      sub: payload.sub,
      username: payload.username,
      userId: user.userId,
      sid: payload.sid,
      // Legacy role field kept for backward compatibility during transition
      // New code should use PermissionService to check user functions
      role: payload.role,
    };
  }
}
