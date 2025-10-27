CREATE TYPE "public"."jawaban_benar" AS ENUM('A', 'B', 'C', 'D', 'E');--> statement-breakpoint
CREATE TABLE "soal_bank" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_soal_id" text NOT NULL,
	"nomor_soal" integer NOT NULL,
	"soal" text NOT NULL,
	"pilihan_a" text NOT NULL,
	"pilihan_b" text NOT NULL,
	"pilihan_c" text NOT NULL,
	"pilihan_d" text NOT NULL,
	"pilihan_e" text,
	"jawaban_benar" "jawaban_benar" NOT NULL,
	"pembahasan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "soal_bank" ADD CONSTRAINT "soal_bank_bank_soal_id_bank_soal_id_fk" FOREIGN KEY ("bank_soal_id") REFERENCES "public"."bank_soal"("id") ON DELETE cascade ON UPDATE no action;