/*
  Warnings:

  - You are about to drop the `job_status` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "LookupData" ADD COLUMN     "name" TEXT;

-- DropTable
DROP TABLE "public"."job_status";

-- CreateTable
CREATE TABLE "JobStatus" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "file_name" TEXT,
    "result_path" TEXT,
    "error_msg" TEXT,
    "total_rows" INTEGER,
    "processed_rows" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LookupData_name_idx" ON "LookupData"("name");
