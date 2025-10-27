CREATE TABLE "hasil_ujian_peserta" (
	"id" text PRIMARY KEY NOT NULL,
	"jadwal_ujian_id" text NOT NULL,
	"peserta_id" text NOT NULL,
	"waktu_mulai" timestamp NOT NULL,
	"waktu_selesai" timestamp,
	"jawaban" text NOT NULL,
	"skor" integer,
	"skor_maksimal" integer,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hasil_ujian_peserta" ADD CONSTRAINT "hasil_ujian_peserta_jadwal_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("jadwal_ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hasil_ujian_peserta" ADD CONSTRAINT "hasil_ujian_peserta_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;