"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/lib/prisma.ts
const client_1 = require("@prisma/client");
const prismaClientSingleton = () => {
    return new client_1.PrismaClient();
};
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? prismaClientSingleton(); // <-- Named export
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
