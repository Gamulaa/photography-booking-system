import { Router } from "express";
import {
  createPortfolioProject,
  deletePortfolioImage,
  deletePortfolioProject,
  listPortfolioProjects,
  updatePortfolioProject,
} from "../controllers/portfolio.controller";
import { requireAdmin } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();

router.get("/", listPortfolioProjects);
router.post(
  "/",
  requireAdmin,
  uploadImage.array("images", 15),
  createPortfolioProject,
);
router.put(
  "/:id",
  requireAdmin,
  uploadImage.array("images", 15),
  updatePortfolioProject,
);
router.delete("/:id/images/:imageId", requireAdmin, deletePortfolioImage);
router.delete("/:id", requireAdmin, deletePortfolioProject);

export default router;
