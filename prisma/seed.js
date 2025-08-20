// Prisma seed script: creates an ADMIN user if missing and a default category
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'anakingstorm@gmail.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin2225';
  const name = process.env.SEED_ADMIN_NAME || 'Administrador';
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, name, password: hash, role: 'ADMIN' }
  });

  await prisma.category.upsert({
    where: { slug: 'generales' },
    update: {},
    create: { name: 'Generales', slug: 'generales' }
  });

  console.log('Seed completo. Admin:', admin.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
