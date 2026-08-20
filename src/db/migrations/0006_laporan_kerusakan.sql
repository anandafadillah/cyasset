CREATE TYPE "public"."laporan_kerusakan_status" AS ENUM('masuk', 'diproses', 'selesai', 'ganti_unit');--> statement-breakpoint
CREATE TYPE "public"."laporan_kerusakan_tingkat" AS ENUM('rusak_ringan', 'rusak_berat');--> statement-breakpoint
CREATE TABLE "laporan_kerusakan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode_tiket" text NOT NULL,
	"barang_id" uuid NOT NULL,
	"deskripsi" text NOT NULL,
	"pelapor" text,
	"jumlah_unit_terdampak" integer NOT NULL,
	"tingkat_kerusakan" "laporan_kerusakan_tingkat" NOT NULL,
	"status" "laporan_kerusakan_status" DEFAULT 'masuk' NOT NULL,
	"mutasi_diterapkan" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "laporan_kerusakan_kode_tiket_unique" UNIQUE("kode_tiket")
);
--> statement-breakpoint
CREATE TABLE "laporan_kerusakan_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"laporan_id" uuid NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiket_counter" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"urut_terakhir" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "laporan_kerusakan" ADD CONSTRAINT "laporan_kerusakan_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_kerusakan" ADD CONSTRAINT "laporan_kerusakan_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_kerusakan" ADD CONSTRAINT "laporan_kerusakan_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_kerusakan_foto" ADD CONSTRAINT "laporan_kerusakan_foto_laporan_id_laporan_kerusakan_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_kerusakan"("id") ON DELETE cascade ON UPDATE no action;