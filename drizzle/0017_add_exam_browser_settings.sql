CREATE TABLE "exam_browser_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"jadwal_ujian_id" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"allowed_browser_pattern" text DEFAULT 'cbt-',
	"max_violations" integer DEFAULT 5,
	"allow_multiple_sessions" boolean DEFAULT false NOT NULL,
	"block_devtools" boolean DEFAULT true NOT NULL,
	"block_screenshot" boolean DEFAULT true NOT NULL,
	"block_right_click" boolean DEFAULT true NOT NULL,
	"block_copy_paste" boolean DEFAULT true NOT NULL,
	"require_fullscreen" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_browser_settings_jadwal_ujian_id_unique" UNIQUE("jadwal_ujian_id")
);
--> statement-breakpoint
ALTER TABLE "exam_browser_settings" ADD CONSTRAINT "exam_browser_settings_jadwal_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("jadwal_ujian_id") REFERENCES "jadwal_ujian"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "jadwal_ujian" DROP COLUMN IF EXISTS "require_exam_browser";--> statement-breakpoint
ALTER TABLE "jadwal_ujian" DROP COLUMN IF EXISTS "allowed_browser_pattern";
