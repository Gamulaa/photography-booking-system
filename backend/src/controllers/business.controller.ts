import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../utils/cloudinaryUpload";
import { updateBusinessSchema } from "../utils/validationSchemas";

const DEFAULT_BUSINESS_ID = "default";

interface HeroShowcaseSlide {
  id: string;
  imageUrl: string;
  imagePublicId: string | null;
}

function parseHeroSlides(raw: unknown): HeroShowcaseSlide[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is HeroShowcaseSlide =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as HeroShowcaseSlide).imageUrl === "string",
    )
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      imageUrl: item.imageUrl,
      imagePublicId: item.imagePublicId ?? null,
    }));
}

export async function getBusinessInfo(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let business = await prisma.businessInformation.findUnique({
      where: { id: DEFAULT_BUSINESS_ID },
    });

    if (!business) {
      business = await prisma.businessInformation.create({
        data: {
          id: DEFAULT_BUSINESS_ID,
          businessName: "Anaf Picture",
          description:
            "Fine art wedding, birthday, graduation, baptism, family, and corporate photography crafted with natural light and timeless elegance.",
          logoUrl: "/logo.png",
          phoneNumber: "+251 911 000 000",
          location: "Addis Ababa, Ethiopia",
          heroShowcaseImages: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...business,
        heroShowcaseImages: parseHeroSlides(business.heroShowcaseImages),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusinessInfo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateBusinessSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const existing = await prisma.businessInformation.findUnique({
      where: { id: DEFAULT_BUSINESS_ID },
    });

    const data = parsed.data;
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const aboutFile = files?.aboutImage?.[0];
    const heroFile = files?.heroImage?.[0];
    const logoFile = files?.logoImage?.[0];
    const heroShowcaseFiles = files?.heroShowcaseImages ?? [];

    let aboutImageUrl = data.aboutImageUrl;
    let heroImageUrl = data.heroImageUrl;
    let heroImagePublicId: string | null | undefined = undefined;
    let oldHeroPublicIdToDelete: string | null = null;

    let logoUrl = data.logoUrl;
    let logoPublicId: string | null | undefined = undefined;
    let oldLogoPublicIdToDelete: string | null = null;

    if (aboutFile) {
      const uploaded = await uploadImageBuffer(aboutFile.buffer, "business");
      aboutImageUrl = uploaded.imageUrl;
    }

    if (heroFile) {
      const uploaded = await uploadImageBuffer(heroFile.buffer, "business");
      heroImageUrl = uploaded.imageUrl;
      heroImagePublicId = uploaded.imagePublicId;
      oldHeroPublicIdToDelete = existing?.heroImagePublicId ?? null;
    }

    if (logoFile) {
      const uploaded = await uploadImageBuffer(logoFile.buffer, "business");
      logoUrl = uploaded.imageUrl;
      logoPublicId = uploaded.imagePublicId;
      oldLogoPublicIdToDelete = existing?.logoPublicId ?? null;
    }

    // Append new Hero Right-Side Showcase slides (uploaded files + optional URLs)
    const currentSlides = parseHeroSlides(existing?.heroShowcaseImages);
    const newSlides: HeroShowcaseSlide[] = [];

    for (const file of heroShowcaseFiles) {
      const uploaded = await uploadImageBuffer(file.buffer, "business");
      newSlides.push({
        id: crypto.randomUUID(),
        imageUrl: uploaded.imageUrl,
        imagePublicId: uploaded.imagePublicId,
      });
    }

    if (data.heroShowcaseUrls) {
      for (const url of data.heroShowcaseUrls) {
        newSlides.push({
          id: crypto.randomUUID(),
          imageUrl: url,
          imagePublicId: null,
        });
      }
    }

    const nextHeroSlides = [...currentSlides, ...newSlides];

    const cleanedSocialLinks: Record<string, string> | undefined =
      data.socialLinks
        ? Object.fromEntries(
            Object.entries(data.socialLinks).filter(
              ([, url]) => url.trim().length > 0,
            ),
          )
        : undefined;

    const updated = await prisma.businessInformation.upsert({
      where: { id: DEFAULT_BUSINESS_ID },
      update: {
        businessName: data.businessName,
        description: data.description,
        aboutExperience: data.aboutExperience,
        phoneNumber: data.phoneNumber,
        email: data.email,
        location: data.location,
        ...(data.mapEmbedUrl !== undefined
          ? { mapEmbedUrl: data.mapEmbedUrl }
          : {}),
        ...(aboutImageUrl !== undefined ? { aboutImageUrl } : {}),
        ...(heroImageUrl !== undefined ? { heroImageUrl } : {}),
        ...(heroImagePublicId !== undefined ? { heroImagePublicId } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(logoPublicId !== undefined ? { logoPublicId } : {}),
        ...(newSlides.length > 0
          ? {
              heroShowcaseImages:
                nextHeroSlides as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(cleanedSocialLinks !== undefined
          ? { socialLinks: cleanedSocialLinks as Prisma.InputJsonValue }
          : {}),
      },
      create: {
        id: DEFAULT_BUSINESS_ID,
        businessName: data.businessName,
        description: data.description,
        aboutExperience: data.aboutExperience ?? null,
        aboutImageUrl: aboutImageUrl ?? null,
        heroImageUrl: heroImageUrl ?? null,
        heroImagePublicId: heroImagePublicId ?? null,
        heroShowcaseImages: nextHeroSlides as unknown as Prisma.InputJsonValue,
        logoUrl: logoUrl ?? null,
        logoPublicId: logoPublicId ?? null,
        mapEmbedUrl: data.mapEmbedUrl ?? null,
        phoneNumber: data.phoneNumber,
        email: data.email ?? null,
        location: data.location ?? null,
        socialLinks: (cleanedSocialLinks ?? {}) as Prisma.InputJsonValue,
      },
    });

    if (oldHeroPublicIdToDelete) {
      await deleteCloudinaryImage(oldHeroPublicIdToDelete);
    }
    if (oldLogoPublicIdToDelete) {
      await deleteCloudinaryImage(oldLogoPublicIdToDelete);
    }

    res.status(200).json({
      success: true,
      message: "Business information updated successfully.",
      data: {
        ...updated,
        heroShowcaseImages: parseHeroSlides(updated.heroShowcaseImages),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteHeroShowcaseImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const slideId = String(req.params.slideId);
    const existing = await prisma.businessInformation.findUnique({
      where: { id: DEFAULT_BUSINESS_ID },
    });

    const slides = parseHeroSlides(existing?.heroShowcaseImages);
    const target = slides.find((s) => s.id === slideId);

    if (!target) {
      next(new AppError("Hero showcase photo not found.", 404));
      return;
    }

    const remaining = slides.filter((s) => s.id !== slideId);

    const updated = await prisma.businessInformation.update({
      where: { id: DEFAULT_BUSINESS_ID },
      data: {
        heroShowcaseImages: remaining as unknown as Prisma.InputJsonValue,
      },
    });

    if (target.imagePublicId) {
      await deleteCloudinaryImage(target.imagePublicId);
    }

    res.status(200).json({
      success: true,
      message: "Hero showcase photo removed.",
      data: {
        ...updated,
        heroShowcaseImages: parseHeroSlides(updated.heroShowcaseImages),
      },
    });
  } catch (error) {
    next(error);
  }
}
