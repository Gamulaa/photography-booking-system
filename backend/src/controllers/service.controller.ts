import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../utils/cloudinaryUpload";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../utils/validationSchemas";

export async function listServices(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const includeInactive = req.query.all === "true" && Boolean(req.admin);

    const services = await prisma.service.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
        portfolioProjects: {
          orderBy: [{ projectDate: "desc" }, { createdAt: "desc" }],
          include: {
            images: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });

    res.status(200).json({
      success: true,
      data: services.map(({ portfolioProjects, images, ...service }) => {
        const directSlides = images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          projectId: service.id,
          projectTitle: service.name,
        }));

        const portfolioSlides = portfolioProjects.flatMap((project) =>
          project.images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            projectId: project.id,
            projectTitle: project.title,
          })),
        );

        return {
          ...service,
          price: Number(service.price),
          images: images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
          })),
          galleryImages: [...directSlides, ...portfolioSlides],
        };
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function createService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const {
      name,
      description,
      price,
      showPrice,
      duration,
      includes,
      isActive,
      galleryImageUrls,
    } = parsed.data;

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const coverFile = files?.image?.[0];
    const galleryFiles = files?.galleryImages ?? [];

    let imageUrl = parsed.data.imageUrl;
    let imagePublicId: string | null = null;

    if (coverFile) {
      const uploaded = await uploadImageBuffer(coverFile.buffer, "services");
      imageUrl = uploaded.imageUrl;
      imagePublicId = uploaded.imagePublicId;
    }

    const uploadedGallery: {
      imageUrl: string;
      imagePublicId: string | null;
    }[] = [];
    for (const file of galleryFiles) {
      const uploaded = await uploadImageBuffer(file.buffer, "services");
      uploadedGallery.push({
        imageUrl: uploaded.imageUrl,
        imagePublicId: uploaded.imagePublicId,
      });
    }
    for (const url of galleryImageUrls) {
      uploadedGallery.push({ imageUrl: url, imagePublicId: null });
    }

    // If admin only uploaded multi-photos without a separate cover, use the first one as cover
    if (!imageUrl && uploadedGallery.length > 0) {
      imageUrl = uploadedGallery[0].imageUrl;
    }

    if (!imageUrl) {
      next(
        new AppError(
          "Please upload at least one service image or provide an image URL.",
          400,
        ),
      );
      return;
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price,
        showPrice,
        duration: duration ?? null,
        includes,
        imageUrl,
        imagePublicId,
        isActive,
        images:
          uploadedGallery.length > 0
            ? {
                create: uploadedGallery.map((img) => ({
                  imageUrl: img.imageUrl,
                  imagePublicId: img.imagePublicId,
                })),
              }
            : undefined,
      },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Photography service created successfully.",
      data: {
        ...service,
        price: Number(service.price),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.service.findUnique({ where: { id } });

    if (!existing) {
      next(new AppError("Photography service not found.", 404));
      return;
    }

    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const data = parsed.data;
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const coverFile = files?.image?.[0];
    const galleryFiles = files?.galleryImages ?? [];

    let nextImageUrl = data.imageUrl;
    let nextImagePublicId: string | null | undefined = undefined;
    let oldPublicIdToDelete: string | null = null;

    if (coverFile) {
      const uploaded = await uploadImageBuffer(coverFile.buffer, "services");
      nextImageUrl = uploaded.imageUrl;
      nextImagePublicId = uploaded.imagePublicId;
      oldPublicIdToDelete = existing.imagePublicId;
    }

    const newGalleryImages: {
      imageUrl: string;
      imagePublicId: string | null;
    }[] = [];
    for (const file of galleryFiles) {
      const uploaded = await uploadImageBuffer(file.buffer, "services");
      newGalleryImages.push({
        imageUrl: uploaded.imageUrl,
        imagePublicId: uploaded.imagePublicId,
      });
    }
    if (data.galleryImageUrls) {
      for (const url of data.galleryImageUrls) {
        newGalleryImages.push({ imageUrl: url, imagePublicId: null });
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.showPrice !== undefined ? { showPrice: data.showPrice } : {}),
        ...(data.duration !== undefined ? { duration: data.duration } : {}),
        ...(data.includes !== undefined ? { includes: data.includes } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
        ...(nextImagePublicId !== undefined
          ? { imagePublicId: nextImagePublicId }
          : {}),
        ...(newGalleryImages.length > 0
          ? {
              images: {
                create: newGalleryImages.map((img) => ({
                  imageUrl: img.imageUrl,
                  imagePublicId: img.imagePublicId,
                })),
              },
            }
          : {}),
      },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (oldPublicIdToDelete) {
      await deleteCloudinaryImage(oldPublicIdToDelete);
    }

    res.status(200).json({
      success: true,
      message: "Photography service updated successfully.",
      data: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteServiceImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = String(req.params.serviceId);
    const imageId = String(req.params.imageId);

    const image = await prisma.serviceImage.findFirst({
      where: { id: imageId, serviceId },
    });

    if (!image) {
      next(new AppError("Service photo not found.", 404));
      return;
    }

    await prisma.serviceImage.delete({ where: { id: imageId } });

    if (image.imagePublicId) {
      await deleteCloudinaryImage(image.imagePublicId);
    }

    res.status(200).json({
      success: true,
      message: "Photo removed from service successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteService(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.service.findUnique({
      where: { id },
      include: {
        images: true,
        _count: { select: { bookings: true } },
      },
    });

    if (!existing) {
      next(new AppError("Photography service not found.", 404));
      return;
    }

    if (existing._count.bookings > 0) {
      next(
        new AppError(
          "This service has existing bookings and cannot be deleted. Deactivate it instead to hide it from customers.",
          409,
        ),
      );
      return;
    }

    await prisma.service.delete({ where: { id } });

    if (existing.imagePublicId) {
      await deleteCloudinaryImage(existing.imagePublicId);
    }
    for (const img of existing.images) {
      if (img.imagePublicId) {
        await deleteCloudinaryImage(img.imagePublicId);
      }
    }

    res.status(200).json({
      success: true,
      message: "Photography service deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
