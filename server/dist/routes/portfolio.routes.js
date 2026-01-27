"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/portfolio.routes.ts - CORRECTED VERSION
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Get user's portfolio (PROTECTED - requires authentication)
router.get("/", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const portfolio = await prisma_1.prisma.portfolio.findUnique({
            where: { userId },
            include: {
                experiences: {
                    orderBy: { startDate: "desc" },
                },
                educations: {
                    orderBy: { startYear: "desc" },
                },
                skills: true,
                languages: true,
                projects: true,
                blogs: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }
        res.json(portfolio);
    }
    catch (error) {
        console.error("Get portfolio error:", error);
        res.status(500).json({ message: "Error fetching portfolio" });
    }
});
// Create or update portfolio (PROTECTED - requires authentication)
router.post("/", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName, title, bio, imageUrl, experiences, educations, skills, languages, projects, blogs, } = req.body;
        // Validate required fields
        if (!fullName || !title || !bio) {
            return res.status(400).json({
                message: "fullName, title, and bio are required",
            });
        }
        let portfolio;
        // Check if portfolio exists
        const existingPortfolio = await prisma_1.prisma.portfolio.findUnique({
            where: { userId },
        });
        if (existingPortfolio) {
            // Update portfolio
            portfolio = await prisma_1.prisma.portfolio.update({
                where: { userId },
                data: {
                    fullName,
                    title,
                    bio,
                    imageUrl: imageUrl || null,
                },
            });
            // Delete existing related data
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.experience.deleteMany({ where: { portfolioId: portfolio.id } }),
                prisma_1.prisma.education.deleteMany({ where: { portfolioId: portfolio.id } }),
                prisma_1.prisma.skill.deleteMany({ where: { portfolioId: portfolio.id } }),
                prisma_1.prisma.language.deleteMany({ where: { portfolioId: portfolio.id } }),
                prisma_1.prisma.project.deleteMany({ where: { portfolioId: portfolio.id } }),
                prisma_1.prisma.blog.deleteMany({ where: { portfolioId: portfolio.id } }),
            ]);
        }
        else {
            // Create new portfolio - FIXED: Use the correct relation syntax
            portfolio = await prisma_1.prisma.portfolio.create({
                data: {
                    fullName,
                    title,
                    bio,
                    imageUrl: imageUrl || null,
                    user: {
                        connect: { id: userId },
                    },
                },
            });
        }
        // Create related data if provided
        const createPromises = [];
        if (experiences && experiences.length > 0) {
            createPromises.push(prisma_1.prisma.experience.createMany({
                data: experiences.map((exp) => ({
                    company: exp.company,
                    position: exp.position,
                    description: exp.description || null,
                    startDate: new Date(exp.startDate),
                    endDate: exp.endDate ? new Date(exp.endDate) : null,
                    portfolioId: portfolio.id,
                })),
            }));
        }
        if (educations && educations.length > 0) {
            createPromises.push(prisma_1.prisma.education.createMany({
                data: educations.map((edu) => ({
                    institution: edu.institution,
                    degree: edu.degree,
                    field: edu.field,
                    startYear: edu.startYear,
                    endYear: edu.endYear || edu.startYear,
                    portfolioId: portfolio.id,
                })),
            }));
        }
        if (skills && skills.length > 0) {
            createPromises.push(prisma_1.prisma.skill.createMany({
                data: skills.map((skill) => ({
                    name: skill.name,
                    level: skill.level || null,
                    portfolioId: portfolio.id,
                })),
            }));
        }
        if (languages && languages.length > 0) {
            createPromises.push(prisma_1.prisma.language.createMany({
                data: languages.map((lang) => ({
                    name: lang.name,
                    level: lang.level || null,
                    portfolioId: portfolio.id,
                })),
            }));
        }
        if (projects && projects.length > 0) {
            createPromises.push(prisma_1.prisma.project.createMany({
                data: projects.map((project) => ({
                    title: project.title,
                    description: project.description || null,
                    technologies: project.technologies || null,
                    link: project.link || null,
                    imageUrl: project.imageUrl || null,
                    portfolioId: portfolio.id,
                })),
            }));
        }
        if (blogs && blogs.length > 0) {
            createPromises.push(prisma_1.prisma.blog.createMany({
                data: blogs.map((blog) => ({
                    title: blog.title,
                    content: blog.content || null,
                    link: blog.link || null,
                    imageUrl: blog.imageUrl || null,
                    portfolioId: portfolio.id,
                })),
            }));
        }
        // Execute all create operations
        if (createPromises.length > 0) {
            await Promise.all(createPromises);
        }
        // Get complete portfolio with relations
        const completePortfolio = await prisma_1.prisma.portfolio.findUnique({
            where: { id: portfolio.id },
            include: {
                experiences: true,
                educations: true,
                skills: true,
                languages: true,
                projects: true,
                blogs: true,
            },
        });
        res.status(existingPortfolio ? 200 : 201).json({
            message: existingPortfolio
                ? "Portfolio updated successfully"
                : "Portfolio created successfully",
            portfolio: completePortfolio,
        });
    }
    catch (error) {
        console.error("Save portfolio error:", error);
        console.error("Error details:", error);
        res.status(500).json({
            message: "Error saving portfolio",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
// Delete portfolio (PROTECTED - requires authentication)
router.delete("/", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const portfolio = await prisma_1.prisma.portfolio.findUnique({
            where: { userId },
        });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }
        await prisma_1.prisma.portfolio.delete({
            where: { userId },
        });
        res.json({ message: "Portfolio deleted successfully" });
    }
    catch (error) {
        console.error("Delete portfolio error:", error);
        res.status(500).json({ message: "Error deleting portfolio" });
    }
});
// Get public portfolio by ID (PUBLIC - no authentication required)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const portfolio = await prisma_1.prisma.portfolio.findUnique({
            where: { id },
            include: {
                experiences: {
                    orderBy: { startDate: "desc" },
                },
                educations: {
                    orderBy: { startYear: "desc" },
                },
                skills: true,
                languages: true,
                projects: true,
                blogs: {
                    orderBy: { createdAt: "desc" },
                },
                user: {
                    select: {
                        username: true,
                    },
                },
            },
        });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }
        // Return public portfolio data
        res.json({
            id: portfolio.id,
            fullName: portfolio.fullName,
            title: portfolio.title,
            bio: portfolio.bio,
            imageUrl: portfolio.imageUrl,
            experiences: portfolio.experiences,
            educations: portfolio.educations,
            skills: portfolio.skills,
            languages: portfolio.languages,
            projects: portfolio.projects,
            blogs: portfolio.blogs,
            username: portfolio.user.username,
            createdAt: portfolio.createdAt,
            updatedAt: portfolio.updatedAt,
        });
    }
    catch (error) {
        console.error("Get public portfolio error:", error);
        res.status(500).json({ message: "Error fetching portfolio" });
    }
});
// Get public portfolio by USERNAME (PUBLIC - no authentication required)
router.get("/user/:username", async (req, res) => {
    try {
        const { username } = req.params;
        // First, find the user by username
        const user = await prisma_1.prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Then find the portfolio by userId
        const portfolio = await prisma_1.prisma.portfolio.findUnique({
            where: { userId: user.id },
            include: {
                experiences: {
                    orderBy: { startDate: "desc" },
                },
                educations: {
                    orderBy: { startYear: "desc" },
                },
                skills: true,
                languages: true,
                projects: true,
                blogs: {
                    orderBy: { createdAt: "desc" },
                },
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!portfolio) {
            return res
                .status(404)
                .json({ message: "Portfolio not found for this user" });
        }
        // Return public portfolio data
        res.json({
            id: portfolio.id,
            fullName: portfolio.fullName,
            title: portfolio.title,
            bio: portfolio.bio,
            imageUrl: portfolio.imageUrl,
            experiences: portfolio.experiences,
            educations: portfolio.educations,
            skills: portfolio.skills,
            languages: portfolio.languages,
            projects: portfolio.projects,
            blogs: portfolio.blogs,
            username: portfolio.user.username,
            createdAt: portfolio.createdAt,
            updatedAt: portfolio.updatedAt,
        });
    }
    catch (error) {
        console.error("Get portfolio by username error:", error);
        res.status(500).json({ message: "Error fetching portfolio" });
    }
});
exports.default = router;
