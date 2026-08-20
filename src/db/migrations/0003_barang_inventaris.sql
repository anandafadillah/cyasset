CREATE TABLE "barang" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" text NOT NULL,
	"merk_tipe" text,
	"kode" text NOT NULL,
	"kategori" text,
	"spesifikasi" text,
	"ruang_id" uuid NOT NULL,
	"sub_lokasi_id" uuid,
	"jumlah_unit" integer NOT NULL,
	"jumlah_baik" integer NOT NULL,
	"jumlah_rusak_ringan" integer NOT NULL,
	"jumlah_rusak_berat" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "barang_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "barang_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barang_id" uuid NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_ruang_id_ruang_id_fk" FOREIGN KEY ("ruang_id") REFERENCES "public"."ruang"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_sub_lokasi_id_sub_lokasi_id_fk" FOREIGN KEY ("sub_lokasi_id") REFERENCES "public"."sub_lokasi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_foto" ADD CONSTRAINT "barang_foto_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;