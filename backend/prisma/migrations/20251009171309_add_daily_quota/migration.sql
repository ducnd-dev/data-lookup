-- CreateTable
CREATE TABLE "ApiQuota" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "daily_limit" INTEGER NOT NULL DEFAULT 100,
    "daily_used" INTEGER NOT NULL DEFAULT 0,
    "last_reset_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiQuota_user_id_key" ON "ApiQuota"("user_id");

-- CreateIndex
CREATE INDEX "ApiQuota_user_id_idx" ON "ApiQuota"("user_id");

-- CreateIndex
CREATE INDEX "ApiQuota_last_reset_date_idx" ON "ApiQuota"("last_reset_date");

-- AddForeignKey
ALTER TABLE "ApiQuota" ADD CONSTRAINT "ApiQuota_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
