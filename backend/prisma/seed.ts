import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Check backend/.env and ensure it is saved as UTF-8.",
  );
}

const prisma = new PrismaClient();

const DEFAULT_SERVICES = [
  {
    name: "Wedding Program",
    description:
      "Full-day documentary and editorial wedding coverage capturing ceremonies, vows, portraits, and reception celebrations.",
    price: 1850.0,
    duration: "Full Day (Up to 8 Hours)",
    includes: [
      "Pre-wedding consultation & timeline planning",
      "400+ high-resolution edited images",
      "Private online gallery with print rights",
      "Sneak peek gallery within 48 hours",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Pre-Wedding Session",
    description:
      "Romantic outdoor or destination couple shoots crafted before your wedding day for save-the-dates and displays.",
    price: 450.0,
    duration: "2.5 Hours",
    includes: [
      "Location scouting & outfit styling guide",
      "80+ high-resolution edited photos",
      "2 outfit changes",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Engagement Photography",
    description:
      "Intimate engagement celebrations and proposal coverage preserving genuine emotion with family and friends.",
    price: 380.0,
    duration: "2 Hours",
    includes: [
      "Candid ceremony & couple portraits",
      "65+ professionally retouched photos",
      "Fast digital gallery delivery",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "HBD / Birthday Program",
    description:
      "Vibrant coverage for milestone birthdays, kids parties, and evening celebrations capturing every toast and smile.",
    price: 300.0,
    duration: "3 Hours",
    includes: [
      "Event highlights, cake cutting & group portraits",
      "100+ color-graded digital images",
      "Online sharing gallery for guests",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Graduation Photography",
    description:
      "Clean, proud individual and family portraits on campus or in-studio celebrating your academic milestone.",
    price: 220.0,
    duration: "90 Minutes",
    includes: [
      "Up to 2 campus or outdoor locations",
      "40 professionally retouched photos",
      "Cap, gown & casual outfit changes",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Baptism Photography",
    description:
      "Respectful, unobtrusive ceremony documentation and warm family portraits honoring this special milestone.",
    price: 340.0,
    duration: "2.5 Hours",
    includes: [
      "Church ceremony & reception coverage",
      "80+ high-resolution edited photographs",
      "Dedicated family & godparent portraits",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Family Photography",
    description:
      "Relaxed golden-hour outdoor or in-home sessions designed to capture authentic family connection.",
    price: 320.0,
    duration: "2 Hours",
    includes: [
      "Location guidance & wardrobe tips",
      "60+ high-resolution edited photographs",
      "Online gallery with full download rights",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Personal Portrait Session",
    description:
      "Expressive studio or outdoor portraits tailored for personal branding, creatives, and editorial profiles.",
    price: 200.0,
    duration: "1 Hour",
    includes: [
      "Guided posing & lighting setup",
      "25 hand-retouched digital portraits",
      "2 outfit changes",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Corporate Event Photography",
    description:
      "Polished conference coverage, executive headshots, and brand event photography built for press and marketing.",
    price: 600.0,
    duration: "4 Hours",
    includes: [
      "Keynote, networking & venue coverage",
      "Next-day press highlight photos",
      "Full commercial usage licensing",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@studiolens.com")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME || "Studio Administrator";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
    },
  });

  const defaultHeroUrl =
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80";

  const existingBusiness = await prisma.businessInformation.findUnique({
    where: { id: "default" },
  });

  if (!existingBusiness) {
    await prisma.businessInformation.create({
      data: {
        id: "default",
        businessName: "Anaf Picture",
        description:
          "Timeless wedding, birthday, graduation, baptism, family, portrait, and corporate photography crafted with natural light and authentic storytelling.",
        aboutExperience:
          "With years of dedication behind the lens, Anaf Picture focuses on unscripted emotion, cinematic composition, and relaxed direction so every client feels effortless in front of the camera.",
        aboutImageUrl:
          "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1200&q=80",
        heroImageUrl: defaultHeroUrl,
        logoUrl: "/logo.png",
        phoneNumber: "+251 911 234 567",
        email: "hello@anafpicture.com",
        location: "Bole, Addis Ababa, Ethiopia",
        socialLinks: {
          instagram: "https://instagram.com",
          facebook: "https://facebook.com",
        },
      },
    });
  } else {
    await prisma.businessInformation.update({
      where: { id: "default" },
      data: {
        businessName:
          existingBusiness.businessName === "Atelier Lumière Photography"
            ? "Anaf Picture"
            : existingBusiness.businessName,
        heroImageUrl: existingBusiness.heroImageUrl || defaultHeroUrl,
        logoUrl: existingBusiness.logoUrl || "/logo.png",
      },
    });
  }

  // Ensure all default programs exist without duplicating existing ones
  const serviceMap = new Map<string, string>();
  for (const item of DEFAULT_SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { name: { equals: item.name, mode: "insensitive" } },
    });

    if (existing) {
      serviceMap.set(item.name, existing.id);
    } else {
      const created = await prisma.service.create({
        data: { ...item, isActive: true },
      });
      serviceMap.set(item.name, created.id);
    }
  }

  // Link any existing unlinked sample projects to matching services
  const weddingServiceId = serviceMap.get("Wedding Program");
  const graduationServiceId = serviceMap.get("Graduation Photography");

  if (weddingServiceId) {
    await prisma.portfolioProject.updateMany({
      where: {
        category: { equals: "Wedding", mode: "insensitive" },
        serviceId: null,
      },
      data: { serviceId: weddingServiceId },
    });
  }
  if (graduationServiceId) {
    await prisma.portfolioProject.updateMany({
      where: {
        category: { equals: "Graduation", mode: "insensitive" },
        serviceId: null,
      },
      data: { serviceId: graduationServiceId },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
