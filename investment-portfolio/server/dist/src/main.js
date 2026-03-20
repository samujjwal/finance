"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const bcrypt = require("bcrypt");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/all-exceptions.filter");
const prisma_service_1 = require("./prisma/prisma.service");
const fee_rates_service_1 = require("./fee-rates/fee-rates.service");
async function bootstrapDatabase(app) {
    const prisma = app.get(prisma_service_1.PrismaService);
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
        console.log("✅ Root user created  →  username: root  /  password: password123#");
    }
    const feeRatesService = app.get(fee_rates_service_1.FeeRatesService);
    await feeRatesService.seedIfEmpty();
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: configService.get("CORS_ORIGIN") || "http://localhost:1420",
        credentials: true,
    });
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const apiPrefix = configService.get("API_PREFIX") || "api";
    app.setGlobalPrefix(apiPrefix);
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Investment Portfolio API")
        .setDescription("API documentation for Investment Portfolio Management")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const port = configService.get("PORT") || 3001;
    await bootstrapDatabase(app);
    await app.listen(port);
    console.log(`🚀 Investment Portfolio API running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
    console.log(`🌐 Environment: ${configService.get("NODE_ENV") || "development"}`);
}
bootstrap();
//# sourceMappingURL=main.js.map