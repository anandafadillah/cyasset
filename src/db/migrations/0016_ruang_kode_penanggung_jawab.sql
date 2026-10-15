ALTER TABLE "ruang" ADD COLUMN "kode" text;--> statement-breakpoint
ALTER TABLE "ruang" ADD COLUMN "penanggung_jawab_nama" text;--> statement-breakpoint
ALTER TABLE "ruang" ADD COLUMN "penanggung_jawab_nip" text;--> statement-breakpoint
ALTER TABLE "ruang" ADD CONSTRAINT "ruang_kode_unique" UNIQUE("kode");