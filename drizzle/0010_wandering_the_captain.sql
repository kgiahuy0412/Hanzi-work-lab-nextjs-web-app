ALTER TABLE "practice_scenarios" ADD COLUMN "reviewer_id" uuid;--> statement-breakpoint
ALTER TABLE "practice_scenarios" ADD COLUMN "review_priority" varchar(16) DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_scenarios" ADD COLUMN "review_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "practice_scenarios" ADD COLUMN "review_requested_at" timestamp with time zone;--> statement-breakpoint
UPDATE "practice_scenarios" SET "review_requested_at" = "updated_at" WHERE "status" = 'review' AND "review_requested_at" IS NULL;--> statement-breakpoint
ALTER TABLE "practice_scenarios" ADD CONSTRAINT "practice_scenarios_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_scenarios_review_queue_idx" ON "practice_scenarios" USING btree ("status","reviewer_id","review_due_at");
