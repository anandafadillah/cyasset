CREATE TABLE "pengaturan_sekolah" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"nama_sekolah" text NOT NULL,
	"provinsi" text,
	"kabupaten_kota" text,
	"unit" text,
	"kota_tanda_tangan" text,
	"kepala_sekolah_nama" text,
	"kepala_sekolah_nip" text,
	"pengurus_barang_nama" text,
	"pengurus_barang_nip" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pengaturan_sekolah" ADD CONSTRAINT "pengaturan_sekolah_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaturan_sekolah" ADD CONSTRAINT "pengaturan_sekolah_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;