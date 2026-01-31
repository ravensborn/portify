"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("./lib/prisma");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const portfolio_routes_1 = __importDefault(
  require("./routes/portfolio.routes"),
);
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(
  "/uploads",
  express_1.default.static(path_1.default.join(__dirname, "../uploads")),
);
// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma_1.prisma.$queryRaw`SELECT 1`;
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
app.use("/api/auth", auth_routes_1.default);
app.use("/api/portfolio", portfolio_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://portify-api:${PORT}`);
  console.log(`📚 API Documentation: http://portify-api:${PORT}/api`);
  console.log(`🔑 Auth endpoints: http://portify-api:${PORT}/api/auth`);
  console.log(
    `🎨 Portfolio endpoints: http://portify-api:${PORT}/api/portfolio`,
  );
  console.log(
    `📋 Template endpoints: http://portify-api:${PORT}/api/templates`,
  );
});
// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    prisma_1.prisma.$disconnect();
  });
});
process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    prisma_1.prisma.$disconnect();
  });
});
