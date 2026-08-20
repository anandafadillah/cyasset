CREATE TYPE "public"."peminjaman_foto_tipe" AS ENUM('awal', 'akhir');--> statement-breakpoint
CREATE TYPE "public"."peminjaman_jenis" AS ENUM('internal', 'eksternal');--> statement-breakpoint
CREATE TYPE "public"."peminjaman_status" AS ENUM('dipinjam', 'dikembalikan');--> statement-breakpoint
CREATE TABLE "peminjaman" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jenis" "peminjaman_jenis" DEFAULT 'internal' NOT NULL,
	"peminjam_nama" text NOT NULL,
	"peminjam_kontak" text,
	"peminjam_keterangan" text,
	"penanggung_jawab" text,
	"lokasi_pemanfaatan" text,
	"nomor_surat" text,
	"tujuan" text NOT NULL,
	"tanggal_pinjam" date NOT NULL,
	"tanggal_rencana_kembali" date NOT NULL,
	"tanggal_kembali_aktual" date,
	"status" "peminjaman_status" DEFAULT 'dipinjam' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "peminjaman_nomor_surat_unique" UNIQUE("nomor_surat")
);
--> statement-breakpoint
CREATE TABLE "peminjaman_foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peminjaman_id" uuid NOT NULL,
	"tipe" "peminjaman_foto_tipe" NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peminjaman_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peminjaman_id" uuid NOT NULL,
	"barang_id" uuid NOT NULL,
	"jumlah" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "peminjaman" ADD CONSTRAINT "peminjaman_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman" ADD CONSTRAINT "peminjaman_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman_foto" ADD CONSTRAINT "peminjaman_foto_peminjaman_id_peminjaman_id_fk" FOREIGN KEY ("peminjaman_id") REFERENCES "public"."peminjaman"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman_item" ADD CONSTRAINT "peminjaman_item_peminjaman_id_peminjaman_id_fk" FOREIGN KEY ("peminjaman_id") REFERENCES "public"."peminjaman"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman_item" ADD CONSTRAINT "peminjaman_item_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE restrict ON UPDATE no action;