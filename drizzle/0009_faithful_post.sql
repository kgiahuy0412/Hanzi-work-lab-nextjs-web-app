CREATE TABLE "practice_audio_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"duration_ms" integer,
	"checksum_sha256" varchar(64) NOT NULL,
	"content" "bytea" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "audio_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "listening_text" text;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD COLUMN "is_statement_correct" boolean;--> statement-breakpoint
ALTER TABLE "practice_audio_assets" ADD CONSTRAINT "practice_audio_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_audio_assets_checksum_uq" ON "practice_audio_assets" USING btree ("checksum_sha256");--> statement-breakpoint
CREATE INDEX "practice_audio_assets_created_idx" ON "practice_audio_assets" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_audio_asset_id_practice_audio_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "public"."practice_audio_assets"("id") ON DELETE set null ON UPDATE no action;