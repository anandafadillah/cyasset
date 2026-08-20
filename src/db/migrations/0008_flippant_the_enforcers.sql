CREATE TYPE "public"."barang_mode" AS ENUM('batch', 'unit');--> statement-breakpoint
CREATE TYPE "public"."barang_unit_kondisi" AS ENUM('baik', 'rusak_ringan', 'rusak_berat', 'hilang', 'diganti');--> statement-breakpoint
CREATE TABLE "barang_unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barang_id" uuid NOT NULL,
	"sub_kode" text NOT NULL,
	"nomor_seri" text,
	"kondisi" "barang_unit_kondisi" DEFAULT 'baik' NOT NULL,
	"ruang_id" uuid NOT NULL,
	"sub_lokasi_id" uuid,
	"catatan" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "barang_unit_sub_kode_unique" UNIQUE("sub_kode")
);
--> statement-breakpoint
CREATE TABLE "barang_unit_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barang_unit_id" uuid NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "mode_pelacakan" "barang_mode" DEFAULT 'batch' NOT NULL;--> statement-breakpoint
ALTER TABLE "barang_unit" ADD CONSTRAINT "barang_unit_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_unit" ADD CONSTRAINT "barang_unit_ruang_id_ruang_id_fk" FOREIGN KEY ("ruang_id") REFERENCES "public"."ruang"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_unit" ADD CONSTRAINT "barang_unit_sub_lokasi_id_sub_lokasi_id_fk" FOREIGN KEY ("sub_lokasi_id") REFERENCES "public"."sub_lokasi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_unit" ADD CONSTRAINT "barang_unit_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_unit" ADD CONSTRAINT "barang_unit_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_unit_foto" ADD CONSTRAINT "barang_unit_foto_barang_unit_id_barang_unit_id_fk" FOREIGN KEY ("barang_unit_id") REFERENCES "public"."barang_unit"("id") ON DELETE cascade ON UPDATE no action;