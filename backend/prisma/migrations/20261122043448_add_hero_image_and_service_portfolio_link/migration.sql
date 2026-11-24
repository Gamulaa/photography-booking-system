-- AlterTable
ALTER TABLE "BusinessInformation" ADD COLUMN     "heroImagePublicId" TEXT,
ADD COLUMN     "heroImageUrl" TEXT;

-- AlterTable
ALTER TABLE "PortfolioProject" ADD COLUMN     "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "PortfolioProject_serviceId_idx" ON "PortfolioProject"("serviceId");

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
