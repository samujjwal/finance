import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as bcrypt from "bcrypt";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { PrismaService } from "./prisma/prisma.service";
import { FeeRatesService } from "./fee-rates/fee-rates.service";

/** Ensure a root user exists and fee rates are seeded before serving traffic */
async function bootstrapDatabase(app: INestApplication) {
  const prisma = app.get(PrismaService);

  // Auto-create root user with known password on first run
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash("password123#", 10);
    await prisma.user.create({
      data: {
        username: "root",
        email: "root@jcl.local",
        passwordHash,
        role: "ROOT",
      },
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

  // Enable CORS
  app.enableCors({
    origin: configService.get("CORS_ORIGIN") || "http://localhost:1420",
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
