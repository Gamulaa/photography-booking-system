import multer from "multer";
import { AppError } from "./error.middleware";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB per image

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 15,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new AppError("Only JPEG, PNG, and WebP image files are allowed.", 400),
      );
      return;
    }
    cb(null, true);
  },
});
