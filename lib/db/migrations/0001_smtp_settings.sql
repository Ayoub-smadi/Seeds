ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smtp_host" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smtp_port" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smtp_user" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smtp_pass" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smtp_from_name" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smtp_from_email" text;
