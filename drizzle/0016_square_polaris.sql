ALTER TABLE "hasil_ujian_peserta" ADD COLUMN "kunci_jawaban_snapshot" text;--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD COLUMN "require_exam_browser" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD COLUMN "allowed_browser_pattern" text DEFAULT 'cbt-';