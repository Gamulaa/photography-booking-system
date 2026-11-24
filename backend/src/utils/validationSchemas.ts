import { BookingStatus } from "@prisma/client";
import { z } from "zod";

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fall through to newline splitting
      }
    }
    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
};

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

const parseSocialLinks = (
  value: unknown,
): Record<string, string> | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      return undefined;
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return undefined;
};

const extractMapUrl = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  return iframeMatch ? iframeMatch[1].trim() : trimmed;
};

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().max(max).optional(),
  );

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const createServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(150),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(3000),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a valid number" })
    .min(0, "Price cannot be negative")
    .max(9999999.99, "Price is too large"),
  showPrice: z
    .preprocess(parseOptionalBoolean, z.boolean().optional())
    .default(true),
  duration: optionalTrimmedString(100),
  includes: z
    .preprocess(parseStringArray, z.array(z.string().max(250)).max(20))
    .default([]),
  imageUrl: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().url("Image URL must be a valid URL").optional(),
  ),
  galleryImageUrls: z
    .preprocess(parseStringArray, z.array(z.string().url()).max(12))
    .default([]),
  isActive: z
    .preprocess(parseOptionalBoolean, z.boolean().optional())
    .default(true),
});

export const updateServiceSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().min(10).max(3000).optional(),
  price: z.coerce.number().min(0).max(9999999.99).optional(),
  showPrice: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  duration: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().max(100).nullable().optional(),
  ),
  includes: z.preprocess(
    (val) => (val === undefined ? undefined : parseStringArray(val)),
    z.array(z.string().max(250)).max(20).optional(),
  ),
  imageUrl: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().url("Image URL must be a valid URL").optional(),
  ),
  galleryImageUrls: z.preprocess(
    (val) => (val === undefined ? undefined : parseStringArray(val)),
    z.array(z.string().url()).max(12).optional(),
  ),
  isActive: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
});

export const createPortfolioSchema = z.object({
  title: z.string().trim().min(2, "Project title is required").max(180),
  category: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(2, "Category is required").max(80).optional(),
  ),
  serviceId: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().uuid("Invalid service selected").optional(),
  ),
  description: optionalTrimmedString(3000),
  projectDate: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Project date must use YYYY-MM-DD format")
      .optional(),
  ),
  imageUrls: z
    .preprocess(parseStringArray, z.array(z.string().url()).max(15))
    .optional(),
});

export const updatePortfolioSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  serviceId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid service selected").nullable().optional(),
  ),
  description: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().max(3000).nullable().optional(),
  ),
  projectDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Project date must use YYYY-MM-DD format")
      .nullable()
      .optional(),
  ),
  imageUrls: z.preprocess(
    (val) => (val === undefined ? undefined : parseStringArray(val)),
    z.array(z.string().url()).max(15).optional(),
  ),
});

export const createBookingSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Full name is required (at least 2 characters)")
    .max(150),
  phoneNumber: z
    .string()
    .trim()
    .min(7, "A valid phone number is required")
    .max(40)
    .regex(/^[+\d][\d\s\-().]{6,39}$/, "Please enter a valid phone number"),
  serviceId: z.string().uuid("Please select a valid photography service"),
  bookingDate: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Preferred booking date must be in YYYY-MM-DD format",
    ),
  preferredTime: optionalTrimmedString(50),
  location: optionalTrimmedString(255),
  message: optionalTrimmedString(2000),
});

export const adminCreateBookingSchema = createBookingSchema.extend({
  status: z
    .nativeEnum(BookingStatus, {
      errorMap: () => ({
        message:
          "Status must be PENDING, CONFIRMED, REJECTED, COMPLETED, or CANCELLED",
      }),
    })
    .default(BookingStatus.CONFIRMED),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus, {
    errorMap: () => ({
      message:
        "Status must be PENDING, CONFIRMED, REJECTED, COMPLETED, or CANCELLED",
    }),
  }),
});

export const updateBusinessSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(150),
  description: z
    .string()
    .trim()
    .min(10, "Business description is required")
    .max(3000),
  aboutExperience: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().max(3000).nullable().optional(),
  ),
  aboutImageUrl: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().url("About image URL must be a valid URL").optional(),
  ),
  heroImageUrl: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z
      .string()
      .trim()
      .url("Hero background image URL must be a valid URL")
      .optional(),
  ),
  heroShowcaseUrls: z.preprocess(
    (val) => (val === undefined ? undefined : parseStringArray(val)),
    z.array(z.string().url()).max(10).optional(),
  ),
  logoUrl: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().max(500).optional(),
  ),
  mapEmbedUrl: z.preprocess(
    extractMapUrl,
    z
      .string()
      .url("Please enter a valid Google Maps embed URL")
      .max(1500)
      .nullable()
      .optional(),
  ),
  phoneNumber: z
    .string()
    .trim()
    .min(7, "Business phone number is required")
    .max(40),
  email: z.preprocess(
    (val) => (val === "" ? null : val),
    z
      .string()
      .trim()
      .email("Invalid email address")
      .max(255)
      .nullable()
      .optional(),
  ),
  location: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().max(255).nullable().optional(),
  ),
  socialLinks: z.preprocess(
    parseSocialLinks,
    z.record(z.string().max(50), z.string().trim().max(300)).optional(),
  ),
});
