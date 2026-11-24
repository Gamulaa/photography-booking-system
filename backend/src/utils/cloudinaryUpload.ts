import { UploadApiResponse } from "cloudinary";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { AppError } from "../middleware/error.middleware";

export interface UploadedImageResult {
  imageUrl: string;
  imagePublicId: string;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: "services" | "portfolio" | "business",
): Promise<UploadedImageResult> {
  if (!isCloudinaryConfigured) {
    throw new AppError(
      "Image upload failed: Cloudinary credentials are not configured in backend/.env.",
      503,
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `photography-studio/${folder}`,
        resource_type: "image",
        transformation: [
          { width: 2000, height: 2000, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(
            new AppError(
              error?.message || "Failed to upload image to Cloudinary",
              502,
            ),
          );
        }

        resolve({
          imageUrl: result.secure_url,
          imagePublicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export async function deleteCloudinaryImage(
  publicId?: string | null,
): Promise<void> {
  if (!publicId || !isCloudinaryConfigured) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error(`Failed to delete Cloudinary image (${publicId}):`, error);
  }
}
