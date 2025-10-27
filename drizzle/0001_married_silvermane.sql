CREATE TABLE "jurusan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kode_jurusan" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jurusan_kode_jurusan_unique" UNIQUE("kode_jurusan")
);
--> statement-breakpoint
CREATE TABLE "kelas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"jurusan_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peserta" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"no_ujian" text NOT NULL,
	"password" text NOT NULL,
	"kelas_id" text NOT NULL,
	"jurusan_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "peserta_no_ujian_unique" UNIQUE("no_ujian")
);
--> statement-breakpoint
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_jurusan_id_jurusan_id_fk" FOREIGN KEY ("jurusan_id") REFERENCES "public"."jurusan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta" ADD CONSTRAINT "peserta_kelas_id_kelas_id_fk" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta" ADD CONSTRAINT "peserta_jurusan_id_jurusan_id_fk" FOREIGN KEY ("jurusan_id") REFERENCES "public"."jurusan"("id") ON DELETE cascade ON UPDATE no action;