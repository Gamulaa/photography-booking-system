import { Router } from "express";
import {
  deleteHeroShowcaseImage,
  getBusinessInfo,
  updateBusinessInfo,
} from "../controllers/business.controller";
import { requireAdmin } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();

router.get("/", getBusinessInfo);
router.put(
  "/",
  requireAdmin,
  uploadImage.fields([
    { name: "heroImage", maxCount: 1 },
    { name: "aboutImage", maxCount: 1 },
    { name: "logoImage", maxCount: 1 },
    { name: "heroShowcaseImages", maxCount: 10 },
  ]),
  updateBusinessInfo,
);
router.delete("/hero-slides/:slideId", requireAdmin, deleteHeroShowcaseImage);

export default router;
