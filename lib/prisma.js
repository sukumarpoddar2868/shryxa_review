import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";

const caPath = path.join(process.cwd(), "certs", "global-bundle.pem");
const ca = fs.readFileSync(caPath, "utf8");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca,
    rejectUnauthorized: true,
  },
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
