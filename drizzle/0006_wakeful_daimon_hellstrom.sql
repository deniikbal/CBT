CREATE TYPE "public"."activity_type" AS ENUM('TAB_BLUR', 'EXIT_FULLSCREEN', 'ATTEMPTED_DEVTOOLS', 'SCREENSHOT_ATTEMPT', 'PAGE_REFRESH', 'ANSWER_CHANGE', 'RIGHT_CLICK', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'SESSION_VIOLATION', 'FORCE_SUBMIT');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"hasil_ujian_id" text NOT NULL,
	"peserta_id" text NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"count" integer DEFAULT 1,
	"metadata" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hasil_ujian_peserta" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "hasil_ujian_peserta" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_hasil_ujian_id_hasil_ujian_peserta_id_fk" FOREIGN KEY ("hasil_ujian_id") REFERENCES "public"."hasil_ujian_peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;