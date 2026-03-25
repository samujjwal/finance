import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as bcrypt from "bcrypt";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { PrismaService } from "./prisma/prisma.service";
import { FeeRatesService } from "./fee-rates/fee-rates.service";

function buildAllowedOrigins(configuredOrigin?: string): string[] {
  const configured = (configuredOrigin || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      "http://localhost:1420",
      "http://localhost:3001",
      "http://tauri.localhost",
      "https://tauri.localhost",
      "tauri://localhost",
      ...configured,
    ]),
  );
}

/** Ensure a root user exists and fee rates are seeded before serving traffic */
async function bootstrapDatabase(app: INestApplication) {
  const prisma = app.get(PrismaService);

  // Always ensure a root user exists with the known password
  const existingRoot = await prisma.user.findFirst({
    where: { userTypeId: "ADMIN", userId: "ROOT" },
  });
  if (!existingRoot) {
    const passwordHash = await bcrypt.hash("password123#", 10);
    await prisma.user.upsert({
      where: { userId: "ROOT" },
      create: {
        userId: "ROOT",
        username: "root",
        email: "root@jcl.local",
        passwordHash,
        firstName: "System",
        surname: "Root",
        branchId: "BRANCH_MAIN",
        userTypeId: "ADMIN",
        status: "ACTIVE",
      },
      update: { passwordHash },
    });
    console.log(
      "✅ Root user created  →  username: root  /  password: password123#",
    );
  }

  // Seed fee rates (FeeRatesService.onModuleInit also does this, but we do it
  // explicitly here so the log appears in startup sequence order)
  const feeRatesService = app.get(FeeRatesService);
  await feeRatesService.seedIfEmpty();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = buildAllowedOrigins(
    configService.get<string>("CORS_ORIGIN"),
  );

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  const apiPrefix = configService.get("API_PREFIX") || "api";
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Investment Portfolio API")
    .setDescription("API documentation for Investment Portfolio Management")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get("PORT") || 3001;
  await bootstrapDatabase(app);
  await app.listen(port);

  console.log(`🚀 Investment Portfolio API running on port ${port}`);
  console.log(
    `📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`,
  );
  console.log(
    `🌐 Environment: ${configService.get("NODE_ENV") || "development"}`,
  );
}

bootstrap();
