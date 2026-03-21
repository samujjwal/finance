process.env.DATABASE_URL = 'file:./investment_portfolio.db';
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true }});
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
