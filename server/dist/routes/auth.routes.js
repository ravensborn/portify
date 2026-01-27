"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Register
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email or username already exists",
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
            },
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        res.status(201).json({
            message: "User created successfully",
            user,
            token,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Error creating user" });
    }
});
// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        // Find user
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});
// Add to src/routes/auth.routes.ts
// Get current user profile (protected)
router.get("/profile", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    }
    catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});
// Update profile
router.put("/profile", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { username, email } = req.body;
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                username,
                email,
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});
exports.default = router;
