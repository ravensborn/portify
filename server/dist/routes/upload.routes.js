"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Create uploads directory if it doesn't exist
const uploadDir = path_1.default.join(__dirname, "../../uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed!"));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});
// Upload profile image (PROTECTED)
router.post("/profile-image", auth_middleware_1.authenticateToken, upload.single("profileImage"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Generate URL for the uploaded file
        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: imageUrl,
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Error uploading image" });
    }
});
// Delete uploaded image (PROTECTED)
router.delete("/profile-image/:filename", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(uploadDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            res.json({ message: "Image deleted successfully" });
        }
        else {
            res.status(404).json({ message: "Image not found" });
        }
    }
    catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Error deleting image" });
    }
});
exports.default = router;
