import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../utils/cloudinaryUpload";
import {
  createPortfolioSchema,
  updatePortfolioSchema,
} from "../utils/validationSchemas";

export async function listPortfolioProjects(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category =
      typeof req.query.category === "string" && req.query.category.trim() !== ""
        ? req.query.category.trim()
        : undefined;

    const serviceId =
      typeof req.query.serviceId === "string" &&
      req.query.serviceId.trim() !== ""
        ? req.query.serviceId.trim()
        : undefined;

    const projects = await prisma.portfolioProject.findMany({
      where: {
        ...(category
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
        ...(serviceId ? { serviceId } : {}),
      },
      include: {
        service: {
          select: { id: true, name: true },
        },
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ projectDate: "desc" }, { createdAt: "desc" }],
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPortfolioProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createPortfolioSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const { title, serviceId, description, projectDate, imageUrls } =
      parsed.data;
    let category = parsed.data.category;

    if (serviceId) {
      const linkedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!linkedService) {
        next(new AppError("Selected photography service was not found.", 400));
        return;
      }
      if (!category) {
        category = linkedService.name;
      }
    }

    if (!category) {
      next(
        new AppError(
          "Please select a service or provide a project category.",
          400,
        ),
      );
      return;
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const uploadedImages: { imageUrl: string; imagePublicId: string | null }[] =
      [];

    for (const file of files) {
      const uploaded = await uploadImageBuffer(file.buffer, "portfolio");
      uploadedImages.push({
        imageUrl: uploaded.imageUrl,
        imagePublicId: uploaded.imagePublicId,
      });
    }

    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        uploadedImages.push({ imageUrl: url, imagePublicId: null });
      }
    }

    if (uploadedImages.length === 0) {
      next(
        new AppError(
          "Please upload at least one image for the portfolio project.",
          400,
        ),
      );
      return;
    }

    const project = await prisma.portfolioProject.create({
      data: {
        title,
        category,
        serviceId: serviceId ?? null,
        description: description ?? null,
        projectDate: projectDate
          ? new Date(`${projectDate}T00:00:00.000Z`)
          : null,
        images: {
          create: uploadedImages,
        },
      },
      include: {
        service: {
          select: { id: true, name: true },
        },
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Portfolio project created successfully.",
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePortfolioProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
    });

    if (!existing) {
      next(new AppError("Portfolio project not found.", 404));
      return;
    }

    const parsed = updatePortfolioSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const { title, category, serviceId, description, projectDate, imageUrls } =
      parsed.data;

    if (serviceId) {
      const linkedService = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!linkedService) {
        next(new AppError("Selected photography service was not found.", 400));
        return;
      }
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const newImages: { imageUrl: string; imagePublicId: string | null }[] = [];

    for (const file of files) {
      const uploaded = await uploadImageBuffer(file.buffer, "portfolio");
      newImages.push({
        imageUrl: uploaded.imageUrl,
        imagePublicId: uploaded.imagePublicId,
      });
    }

    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        newImages.push({ imageUrl: url, imagePublicId: null });
      }
    }

    const updated = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(serviceId !== undefined ? { serviceId } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(projectDate !== undefined
          ? {
              projectDate: projectDate
                ? new Date(`${projectDate}T00:00:00.000Z`)
                : null,
            }
          : {}),
        ...(newImages.length > 0
          ? {
              images: {
                create: newImages,
              },
            }
          : {}),
      },
      include: {
        service: {
          select: { id: true, name: true },
        },
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Portfolio project updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePortfolioImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId = String(req.params.id);
    const imageId = String(req.params.imageId);

    const image = await prisma.portfolioImage.findFirst({
      where: { id: imageId, projectId },
    });

    if (!image) {
      next(new AppError("Portfolio image not found.", 404));
      return;
    }

    await prisma.portfolioImage.delete({ where: { id: imageId } });

    if (image.imagePublicId) {
      await deleteCloudinaryImage(image.imagePublicId);
    }

    res.status(200).json({
      success: true,
      message: "Image removed from project successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePortfolioProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      next(new AppError("Portfolio project not found.", 404));
      return;
    }

    await prisma.portfolioProject.delete({ where: { id } });

    await Promise.allSettled(
      existing.images
        .filter((img) => Boolean(img.imagePublicId))
        .map((img) => deleteCloudinaryImage(img.imagePublicId)),
    );

    res.status(200).json({
      success: true,
      message: "Portfolio project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
