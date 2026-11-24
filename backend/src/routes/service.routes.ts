import { Router } from "express";
import {
  createService,
  deleteService,
  deleteServiceImage,
  listServices,
  updateService,
} from "../controllers/service.controller";
import { optionalAdmin, requireAdmin } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();

const serviceUploads = uploadImage.fields([
  { name: "image", maxCount: 1 },
  { name: "galleryImages", maxCount: 12 },
]);

router.get("/", optionalAdmin, listServices);
router.post("/", requireAdmin, serviceUploads, createService);
router.put("/:id", requireAdmin, serviceUploads, updateService);
router.delete("/:serviceId/images/:imageId", requireAdmin, deleteServiceImage);
router.delete("/:id", requireAdmin, deleteService);

export default router;
