ALTER TABLE "courses" ADD COLUMN "hanzi" varchar(12);--> statement-breakpoint
UPDATE "courses" SET "hanzi" = '职' WHERE "hanzi" IS NULL;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "hanzi" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "lesson_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "total_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "free_lesson_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "theme_color" varchar(20) DEFAULT '#dcebe2' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "theme_ink" varchar(20) DEFAULT '#176b5b' NOT NULL;
