import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // Create roles
  const adminRole = await prisma.role.upsert({
    where: {
      name: "ADMIN",
    },
    update: {},
    create: {
      name: "ADMIN",
    },
  });

  await prisma.role.upsert({
    where: {
      name: "CLIENT",
    },
    update: {},
    create: {
      name: "CLIENT",
    },
  });

  // Hash admin password
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD,
    12
  );

  // Create/update admin user
  const admin = await prisma.user.upsert({
    where: {
      email: process.env.ADMIN_EMAIL,
    },
    update: {
      passwordHash,
      roleId: adminRole.id,
    },
    create: {
      name: "Shryxa Admin",
      email: process.env.ADMIN_EMAIL,
      passwordHash,
      roleId: adminRole.id,
    },
  });

  console.log("✅ Roles created");
  console.log(`✅ Admin user ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
