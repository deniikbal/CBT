CREATE TABLE "bank_soal" (
	"id" text PRIMARY KEY NOT NULL,
	"kode_banksoal" text NOT NULL,
	"matpel_id" text NOT NULL,
	"jumlah_soal" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_soal_kode_banksoal_unique" UNIQUE("kode_banksoal")
);
--> statement-breakpoint
CREATE TABLE "mata_pelajaran" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kode_matpel" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mata_pelajaran_kode_matpel_unique" UNIQUE("kode_matpel")
);
--> statement-breakpoint
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_matpel_id_mata_pelajaran_id_fk" FOREIGN KEY ("matpel_id") REFERENCES "public"."mata_pelajaran"("id") ON DELETE cascade ON UPDATE no action;