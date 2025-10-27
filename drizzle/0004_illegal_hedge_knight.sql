CREATE TABLE "jadwal_ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"nama_ujian" text NOT NULL,
	"bank_soal_id" text NOT NULL,
	"kelas_id" text,
	"tanggal_ujian" timestamp NOT NULL,
	"jam_mulai" text NOT NULL,
	"durasi" integer NOT NULL,
	"minimum_pengerjaan" integer,
	"acak_soal" boolean DEFAULT false NOT NULL,
	"acak_opsi" boolean DEFAULT false NOT NULL,
	"tampilkan_nilai" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_ujian_peserta" (
	"id" text PRIMARY KEY NOT NULL,
	"jadwal_ujian_id" text NOT NULL,
	"peserta_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_bank_soal_id_bank_soal_id_fk" FOREIGN KEY ("bank_soal_id") REFERENCES "public"."bank_soal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_kelas_id_kelas_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_ujian_peserta" ADD CONSTRAINT "jadwal_ujian_peserta_jadwal_ujian_id_jadwal_ujian_id_fk" FOREIGN KEY ("jadwal_ujian_id") REFERENCES "public"."jadwal_ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_ujian_peserta" ADD CONSTRAINT "jadwal_ujian_peserta_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;