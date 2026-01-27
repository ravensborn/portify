// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { prisma } from "./lib/prisma";

// Routes
import authRoutes from "./routes/auth.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import uploadRoutes from "./routes/upload.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      version: "1.0.0",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/upload", uploadRoutes);

// API Documentation
app.get("/api", (req, res) => {
  res.json({
    message: "Portify API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile (protected)",
      },
      portfolio: {
        get: "GET /api/portfolio (protected)",
        create_update: "POST /api/portfolio (protected)",
        delete: "DELETE /api/portfolio (protected)",
        public: "GET /api/portfolio/:id",
      },
      templates: {
        list: "GET /api/templates",
        get: "GET /api/templates/:id",
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
    });
  },
);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`🎨 Portfolio endpoints: http://localhost:${PORT}/api/portfolio`);
  console.log(`📋 Template endpoints: http://localhost:${PORT}/api/templates`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    prisma.$disconnect();
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    prisma.$disconnect();
  });
});
