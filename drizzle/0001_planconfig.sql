CREATE TABLE "user_plan_config" (
	"user_id" text PRIMARY KEY NOT NULL,
	"race_name" text NOT NULL,
	"race_location" text,
	"race_date" text NOT NULL,
	"distance_km" real NOT NULL,
	"elevation_hm" integer NOT NULL,
	"plan_start" text NOT NULL,
	"training_days" integer DEFAULT 5 NOT NULL,
	"philosophy" text DEFAULT 'haeufig' NOT NULL,
	"intensity" text DEFAULT 'locker' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"preset" text,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_plan_config" ADD CONSTRAINT "user_plan_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;