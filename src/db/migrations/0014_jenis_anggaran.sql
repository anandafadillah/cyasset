ALTER TABLE "barang" ALTER COLUMN "sumber_dana" SET DATA TYPE text;--> statement-breakpoint
-- Konversi nilai lama sebelum di-cast ke enum baru: bos → bosp, komite_sekolah/
-- mandiri_yayasan → lainnya dengan label lamanya disimpan di sumber_dana_lainnya
-- (tidak menimpa isian yang sudah ada) supaya informasinya tidak hilang.
UPDATE "barang" SET "sumber_dana" = 'bosp' WHERE "sumber_dana" = 'bos';--> statement-breakpoint
UPDATE "barang" SET
	"sumber_dana_lainnya" = COALESCE(NULLIF("sumber_dana_lainnya", ''), CASE "sumber_dana" WHEN 'komite_sekolah' THEN 'Komite Sekolah' ELSE 'Mandiri Yayasan' END),
	"sumber_dana" = 'lainnya'
WHERE "sumber_dana" IN ('komite_sekolah', 'mandiri_yayasan');--> statement-breakpoint
DROP TYPE "public"."barang_sumber_dana";--> statement-breakpoint
CREATE TYPE "public"."barang_sumber_dana" AS ENUM('bosp', 'ssg', 'hibah', 'lainnya');--> statement-breakpoint
ALTER TABLE "barang" ALTER COLUMN "sumber_dana" SET DATA TYPE "public"."barang_sumber_dana" USING "sumber_dana"::"public"."barang_sumber_dana";--> statement-breakpoint
ALTER TABLE "prasarana" ALTER COLUMN "sumber_dana" SET DATA TYPE text;--> statement-breakpoint
UPDATE "prasarana" SET "sumber_dana" = 'bosp' WHERE "sumber_dana" = 'bos';--> statement-breakpoint
UPDATE "prasarana" SET
	"sumber_dana_lainnya" = COALESCE(NULLIF("sumber_dana_lainnya", ''), CASE "sumber_dana" WHEN 'komite_sekolah' THEN 'Komite Sekolah' ELSE 'Mandiri Yayasan' END),
	"sumber_dana" = 'lainnya'
WHERE "sumber_dana" IN ('komite_sekolah', 'mandiri_yayasan');--> statement-breakpoint
DROP TYPE "public"."prasarana_sumber_dana";--> statement-breakpoint
CREATE TYPE "public"."prasarana_sumber_dana" AS ENUM('bosp', 'ssg', 'hibah', 'lainnya');--> statement-breakpoint
ALTER TABLE "prasarana" ALTER COLUMN "sumber_dana" SET DATA TYPE "public"."prasarana_sumber_dana" USING "sumber_dana"::"public"."prasarana_sumber_dana";
