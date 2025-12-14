const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { validationResult } = require("express-validator");
const prisma = require("../prisma");
const { ensureAuthenticated } = require("../middleware/auth");
const { validateFileUpload, validateFolderAssignment, handleValidationErrors } = require("../middleware/valid");

const router = express.Router();

// Configure multer for disk storage (local uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|mov|avi|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error("Only specific file types are allowed!"));
  },
});

// GET /files/public - List all public files
router.get("/public", async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { name: true } },
        folder: { select: { name: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });
    res.render("files/public", { files, title: "Public Files" });
  } catch (error) {
    console.error("Error fetching public files:", error);
    res.status(500).render("error", { title: "Error", message: "Unable to load public files", error });
  }
});

// GET /files - List all files for current user
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { userId: req.user.id },
      include: { folder: { select: { id: true, name: true } } },
      orderBy: { uploadedAt: "desc" },
    });
    res.render("files/index", { title: "My Files", files, user: req.user });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).render("error", { error, title: "Error" });
  }
});

// GET /files/upload - Show upload form
router.get("/upload", ensureAuthenticated, async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id },
      orderBy: { name: "asc" },
    });
    res.render("files/upload", { title: "Upload File", folders, selectedFolderId: req.query.folder || null });
  } catch {
    res.render("files/upload", { title: "Upload File", folders: [], selectedFolderId: null });
  }
});

// POST /files/upload - Handle file upload
router.post("/upload", ensureAuthenticated, upload.single("file"), validateFileUpload, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => req.flash("error", error.msg));
      return res.redirect("/files/upload");
    }

    if (!req.file) {
      req.flash("error", "No file uploaded");
      return res.redirect("/files/upload");
    }

    let folderId = req.body.folderId || null;
    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user.id } });
      if (!folder) folderId = null;
    }

    await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        description: req.body.description || null,
        isPublic: req.body.isPublic === "true",
        userId: req.user.id,
        folderId,
      },
    });

    req.flash("success", "File uploaded successfully!");
    res.redirect("/files");
  } catch (error) {
    console.error("Error uploading file:", error);
    req.flash("error", `An error occurred: ${error.message}`);
    res.redirect("/files/upload");
  }
});

// GET /files/:id/download - Download a file
router.get("/:id/download", async (req, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: { id: Number(req.params.id), OR: [{ userId: req.user?.id }, { isPublic: true }] },
    });
    if (!file) return res.status(404).render("404", { title: "File Not Found" });
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).render("error", { error, title: "Error" });
  }
});

// DELETE /files/:id - Delete a file
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const file = await prisma.file.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!file) return res.status(404).json({ error: "File not found" });

    try {
      await fs.unlink(file.path);
    } catch (fsError) {
      console.error("Error deleting file from filesystem:", fsError);
    }

    await prisma.file.delete({ where: { id: file.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /files/:id - Show file info page
router.get("/:id", async (req, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: { id: Number(req.params.id), OR: [{ userId: req.user?.id }, { isPublic: true }] },
      include: {
        user: { select: { name: true, email: true } },
        folder: { select: { id: true, name: true, parent: { select: { id: true, name: true } } } },
      },
    });
    if (!file) return res.status(404).render("404", { title: "File Not Found" });

    let folders = [];
    if (req.user && file.userId === req.user.id) {
      folders = await prisma.folder.findMany({ where: { userId: req.user.id }, orderBy: { name: "asc" } });
    }

    res.render("files/info", { title: file.originalName, file, folders, user: req.user, canEdit: req.user && file.userId === req.user.id });
  } catch (error) {
    console.error("Error fetching file info:", error);
    res.status(500).render("error", { error, title: "Error" });
  }
});

// POST /files/:id/assign-folder - Update file's folder assignment
router.post("/:id/assign-folder", ensureAuthenticated, validateFolderAssignment, handleValidationErrors, async (req, res) => {
  try {
    const { folderId } = req.body;
    const file = await prisma.file.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!file) {
      req.flash("error", "File not found");
      return res.redirect("/files");
    }

    let validatedFolderId = null;
    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user.id } });
      if (!folder) {
        req.flash("error", "Selected folder not found");
        return res.redirect(`/files/${req.params.id}`);
      }
      validatedFolderId = folderId;
    }

    await prisma.file.update({ where: { id: file.id }, data: { folderId: validatedFolderId } });
    req.flash("success", "File moved successfully");
    res.redirect(`/files/${req.params.id}`);
  } catch (error) {
    console.error("Error updating file folder:", error);
    req.flash("error", "Unable to move file");
    res.redirect(`/files/${req.params.id}`);
  }
});

module.exports = router;
