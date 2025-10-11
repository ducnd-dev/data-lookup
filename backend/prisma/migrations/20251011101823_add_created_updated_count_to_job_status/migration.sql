-- AlterTable
ALTER TABLE "JobStatus" ADD COLUMN     "created_count" INTEGER DEFAULT 0,
ADD COLUMN     "updated_count" INTEGER DEFAULT 0;
