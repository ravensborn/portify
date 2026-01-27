import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Upload profile image (PROTECTED)
router.post(
  "/profile-image",
  authenticateToken,
  upload.single("profileImage"),
  async (req: any, res) => {
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
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Error uploading image" });
    }
  },
);

// Delete uploaded image (PROTECTED)
router.delete(
  "/profile-image/:filename",
  authenticateToken,
  async (req: any, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Error deleting image" });
    }
  },
);

export default router;
