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
      // Legacy role field kept for backward compatibility during transition
      // New code should use PermissionService to check user functions
      role: payload.role,
    };
  }
}
