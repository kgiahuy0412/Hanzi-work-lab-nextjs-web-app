CREATE TYPE "public"."practice_audio_review_status" AS ENUM('pending', 'approved', 're_record');--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD COLUMN "storage_provider" varchar(24) DEFAULT 'database' NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD COLUMN "cloudinary_asset_id" varchar(255);--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD COLUMN "cloudinary_public_id" varchar(500);--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD COLUMN "cloudinary_version" integer;--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD COLUMN "cloudinary_secure_url" text;--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD COLUMN "cloudinary_format" varchar(24);--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "audio_review_status" "practice_audio_review_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "audio_review_issues" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "audio_review_notes" text;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "audio_reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "audio_reviewed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "practice_exercises" AS "exercise"
SET "audio_review_status" = 'approved'
WHERE ("exercise"."audio_asset_id" IS NOT NULL OR NULLIF(BTRIM("exercise"."audio_url"), '') IS NOT NULL)
AND EXISTS (
	SELECT 1
	FROM "practice_scenarios" AS "scenario"
	INNER JOIN "practice_industries" AS "industry" ON "industry"."id" = "scenario"."industry_id"
	WHERE "scenario"."id" = "exercise"."scenario_id"
	AND "scenario"."status" = 'published'
	AND "industry"."status" = 'published'
);--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_audio_reviewed_by_users_id_fk" FOREIGN KEY ("audio_reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_audio_assets_cloudinary_asset_uq" ON "practice_audio_assets" USING btree ("cloudinary_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "practice_audio_assets_cloudinary_public_uq" ON "practice_audio_assets" USING btree ("cloudinary_public_id");--> statement-breakpoint
CREATE INDEX "practice_exercises_audio_review_idx" ON "practice_exercises" USING btree ("scenario_id","audio_review_status");
