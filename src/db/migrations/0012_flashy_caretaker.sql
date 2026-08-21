CREATE TABLE "barang_lokasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barang_id" uuid NOT NULL,
	"ruang_id" uuid NOT NULL,
	"sub_lokasi_id" uuid,
	"jumlah" integer NOT NULL,
	"jumlah_baik" integer NOT NULL,
	"jumlah_rusak_ringan" integer NOT NULL,
	"jumlah_rusak_berat" integer NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barang_lokasi" ADD CONSTRAINT "barang_lokasi_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_lokasi" ADD CONSTRAINT "barang_lokasi_ruang_id_ruang_id_fk" FOREIGN KEY ("ruang_id") REFERENCES "public"."ruang"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_lokasi" ADD CONSTRAINT "barang_lokasi_sub_lokasi_id_sub_lokasi_id_fk" FOREIGN KEY ("sub_lokasi_id") REFERENCES "public"."sub_lokasi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_lokasi" ADD CONSTRAINT "barang_lokasi_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_lokasi" ADD CONSTRAINT "barang_lokasi_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Backfill: barang batch yang sudah ada belum punya baris barang_lokasi sama
-- sekali, jadi tanpa ini mereka akan "hilang" dari LIR/halaman Lokasi begitu
-- kode barunya membaca dari barang_lokasi. Bikin 1 baris dari data yang
-- sudah ada sekarang (ruangId/jumlah* saat ini) supaya tidak ada yang hilang.
INSERT INTO "barang_lokasi" ("barang_id", "ruang_id", "sub_lokasi_id", "jumlah", "jumlah_baik", "jumlah_rusak_ringan", "jumlah_rusak_berat", "created_by", "updated_by")
SELECT "id", "ruang_id", "sub_lokasi_id", "jumlah_unit", "jumlah_baik", "jumlah_rusak_ringan", "jumlah_rusak_berat", "created_by", "updated_by"
FROM "barang"
WHERE "mode_pelacakan" = 'batch';