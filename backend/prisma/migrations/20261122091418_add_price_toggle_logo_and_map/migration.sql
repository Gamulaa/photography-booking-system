-- AlterTable
ALTER TABLE "BusinessInformation" ADD COLUMN     "logoPublicId" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "mapEmbedUrl" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "showPrice" BOOLEAN NOT NULL DEFAULT true;
