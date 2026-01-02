require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("DB OK");
  } catch (e) {
    console.error("DB FAIL:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
