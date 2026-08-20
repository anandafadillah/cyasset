CREATE TYPE "public"."prasarana_jenis" AS ENUM('pembangunan_baru', 'perbaikan', 'pemeliharaan');--> statement-breakpoint
CREATE TYPE "public"."prasarana_status" AS ENUM('direncanakan', 'proses', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."prasarana_sumber_dana" AS ENUM('ssg', 'bos', 'komite_sekolah', 'mandiri_yayasan', 'lainnya');--> statement-breakpoint
CREATE TABLE "prasarana" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"jenis" "prasarana_jenis" NOT NULL,
	"deskripsi" text,
	"lokasi" text,
	"status" "prasarana_status" DEFAULT 'direncanakan' NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date,
	"sumber_dana" "prasarana_sumber_dana" NOT NULL,
	"sumber_dana_lainnya" text,
	"periode_dana" text,
	"nominal_dana" integer,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prasarana_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prasarana_id" uuid NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prasarana" ADD CONSTRAINT "prasarana_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prasarana" ADD CONSTRAINT "prasarana_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prasarana_foto" ADD CONSTRAINT "prasarana_foto_prasarana_id_prasarana_id_fk" FOREIGN KEY ("prasarana_id") REFERENCES "public"."prasarana"("id") ON DELETE cascade ON UPDATE no action;