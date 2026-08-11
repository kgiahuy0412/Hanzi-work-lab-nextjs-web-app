CREATE TYPE "public"."vip_activation_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "vip_activation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "vip_activation_request_status" DEFAULT 'pending' NOT NULL,
	"source" varchar(40) DEFAULT 'vip_page' NOT NULL,
	"user_note" text,
	"admin_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"subscription_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vip_activation_requests" ADD CONSTRAINT "vip_activation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_activation_requests" ADD CONSTRAINT "vip_activation_requests_plan_id_vip_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."vip_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_activation_requests" ADD CONSTRAINT "vip_activation_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_activation_requests" ADD CONSTRAINT "vip_activation_requests_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vip_activation_requests_user_pending_uq" ON "vip_activation_requests" USING btree ("user_id") WHERE "vip_activation_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "vip_activation_requests_status_created_idx" ON "vip_activation_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "vip_activation_requests_user_created_idx" ON "vip_activation_requests" USING btree ("user_id","created_at");