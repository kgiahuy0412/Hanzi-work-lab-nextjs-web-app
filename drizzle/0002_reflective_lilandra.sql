ALTER TABLE "modules" ADD COLUMN "slug" varchar(160);--> statement-breakpoint
UPDATE "modules" SET "slug" = 'module-' || "id"::text WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "slug" varchar(180);--> statement-breakpoint
UPDATE "vocabulary" SET "slug" = 'word-' || "id"::text WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "modules_course_slug_uq" ON "modules" USING btree ("course_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vocabulary_slug_uq" ON "vocabulary" USING btree ("slug");
