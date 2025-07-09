/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Designation` table. All the data in the column will be lost.
  - You are about to drop the column `contactDetails` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `files` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `specifications` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the `PCBSpecification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `Designation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `RFQ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `RFQ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'EMPLOYEE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SPECTValueType" AS ENUM ('TEXT', 'MULTIPLE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('CREATED', 'PENDING', 'APPROVED', 'PROGRESS', 'QUOTED', 'REJECTED', 'DELETED');

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_userId_fkey";

-- DropForeignKey
ALTER TABLE "Designation" DROP CONSTRAINT "Designation_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PCBSpecification" DROP CONSTRAINT "PCBSpecification_rfqId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropIndex
DROP INDEX "Customer_userId_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "organizationId",
DROP COLUMN "userId",
ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "Designation" DROP COLUMN "parentId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RFQ" DROP COLUMN "contactDetails",
DROP COLUMN "files",
DROP COLUMN "specifications",
DROP COLUMN "updatedBy",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "newsletter" BOOLEAN,
ADD COLUMN     "partNumber" TEXT,
ADD COLUMN     "projectName" TEXT,
ADD COLUMN     "quantity" TEXT,
ADD COLUMN     "servicetype" TEXT[],
ADD COLUMN     "status" "RFQStatus" NOT NULL DEFAULT 'CREATED',
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'ADMIN';

-- DropTable
DROP TABLE "PCBSpecification";

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQSpecification" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "rfqId" TEXT,
    "specificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "valueType" "SPECTValueType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationValue" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT,
    "storageType" TEXT NOT NULL DEFAULT 'local',
    "modelType" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "originalname" TEXT,
    "mimetype" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RFQToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RFQToService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specification_name_key" ON "Specification"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specification_slug_key" ON "Specification"("slug");

-- CreateIndex
CREATE INDEX "_RFQToService_B_index" ON "_RFQToService"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSpecification" ADD CONSTRAINT "RFQSpecification_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSpecification" ADD CONSTRAINT "RFQSpecification_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationValue" ADD CONSTRAINT "SpecificationValue_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RFQToService" ADD CONSTRAINT "_RFQToService_A_fkey" FOREIGN KEY ("A") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RFQToService" ADD CONSTRAINT "_RFQToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
