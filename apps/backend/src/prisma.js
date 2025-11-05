const { PrismaClient } = require("./generated/prisma"); // import from the generated path
const prisma = new PrismaClient();

module.exports = { prisma };