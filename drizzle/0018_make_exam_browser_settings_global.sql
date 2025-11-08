ALTER TABLE "exam_browser_settings" DROP CONSTRAINT IF EXISTS "exam_browser_settings_jadwal_ujian_id_jadwal_ujian_id_fk";
ALTER TABLE "exam_browser_settings" DROP CONSTRAINT IF EXISTS "exam_browser_settings_jadwal_ujian_id_unique";
ALTER TABLE "exam_browser_settings" DROP COLUMN IF EXISTS "jadwal_ujian_id";
