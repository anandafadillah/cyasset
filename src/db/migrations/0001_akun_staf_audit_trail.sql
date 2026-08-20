ALTER TABLE "staff" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;