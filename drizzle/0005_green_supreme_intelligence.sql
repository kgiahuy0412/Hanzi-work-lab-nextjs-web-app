CREATE TABLE "game_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" varchar(40) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" varchar(120) NOT NULL,
	"industry" varchar(40) NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_attempts" ADD CONSTRAINT "game_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_attempts_user_completed_idx" ON "game_attempts" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "game_attempts_user_game_idx" ON "game_attempts" USING btree ("user_id","game_id");--> statement-breakpoint
CREATE INDEX "practice_attempts_user_completed_idx" ON "practice_attempts" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "practice_attempts_user_scenario_idx" ON "practice_attempts" USING btree ("user_id","scenario_id");