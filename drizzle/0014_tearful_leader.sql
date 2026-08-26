ALTER TABLE "vip_plans" ADD COLUMN "discount_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_plans" ADD COLUMN "promotion_label" varchar(160);--> statement-breakpoint
ALTER TABLE "vip_plans" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;