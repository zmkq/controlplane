-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "phoneFormat" TEXT NOT NULL DEFAULT 'international',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Amman',
    "brandColor" TEXT NOT NULL DEFAULT '#dbec0a',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- Ensure updatedAt auto-updates
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_app_settings_updated
BEFORE UPDATE ON "AppSettings"
FOR EACH ROW
EXECUTE PROCEDURE update_app_settings_updated_at();
