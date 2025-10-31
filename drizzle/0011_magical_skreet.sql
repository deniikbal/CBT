ALTER TABLE "bank_soal" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "peserta" ADD COLUMN "unhashed_password" text;--> statement-breakpoint
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;