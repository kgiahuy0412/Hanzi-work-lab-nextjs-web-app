CREATE TABLE "practice_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"slug" varchar(120) NOT NULL,
	"eyebrow" varchar(160) NOT NULL,
	"prompt" text NOT NULL,
	"chinese" text,
	"audio_url" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_option" integer DEFAULT 0 NOT NULL,
	"explanation" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"label" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_scenario_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_note" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry_id" uuid NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(180) NOT NULL,
	"brief" text NOT NULL,
	"context" text NOT NULL,
	"duration_minutes" integer DEFAULT 7 NOT NULL,
	"level" varchar(40) DEFAULT 'Thực tế' NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"sentence_zh" text NOT NULL,
	"pinyin" text NOT NULL,
	"translation" text NOT NULL,
	"focus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_scenario_id_practice_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."practice_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_scenario_versions" ADD CONSTRAINT "practice_scenario_versions_scenario_id_practice_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."practice_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_scenario_versions" ADD CONSTRAINT "practice_scenario_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_scenarios" ADD CONSTRAINT "practice_scenarios_industry_id_practice_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."practice_industries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_exercises_scenario_slug_uq" ON "practice_exercises" USING btree ("scenario_id","slug");--> statement-breakpoint
CREATE INDEX "practice_exercises_scenario_sort_idx" ON "practice_exercises" USING btree ("scenario_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "practice_industries_slug_uq" ON "practice_industries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "practice_industries_status_sort_idx" ON "practice_industries" USING btree ("status","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "practice_scenario_version_uq" ON "practice_scenario_versions" USING btree ("scenario_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "practice_scenarios_slug_uq" ON "practice_scenarios" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "practice_scenarios_industry_sort_idx" ON "practice_scenarios" USING btree ("industry_id","sort_order");--> statement-breakpoint
CREATE INDEX "practice_scenarios_status_idx" ON "practice_scenarios" USING btree ("status");