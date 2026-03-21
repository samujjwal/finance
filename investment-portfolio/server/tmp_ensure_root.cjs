// Reset/create root user with known credentials for API testing
process.env.DATABASE_URL = 'file:./investment_portfolio.db';
const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('./node_modules/bcrypt');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123#', 10);
  const result = await prisma.user.upsert({
    where: { username: 'root' },
    create: { username: 'root', email: 'root@jcl.local', passwordHash, role: 'ROOT' },
    update: { role: 'ROOT', passwordHash, email: 'root@jcl.local' },
  });
  console.log('Root user ensured:', { id: result.id, username: result.username, role: result.role });
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
