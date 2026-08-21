CREATE TYPE "public"."barang_sumber_dana" AS ENUM('ssg', 'bos', 'komite_sekolah', 'mandiri_yayasan', 'lainnya');--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "tanggal_masuk" date;--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "sumber_dana" "barang_sumber_dana";--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "sumber_dana_lainnya" text;--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "periode_dana" text;--> statement-breakpoint
ALTER TABLE "barang" ADD COLUMN "nominal_dana" integer;