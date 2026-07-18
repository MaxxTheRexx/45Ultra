CREATE TABLE "strava_connection" (
	"user_id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_enc" text NOT NULL,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"athlete_id" text,
	"athlete_name" text,
	"synced_after" bigint DEFAULT 0 NOT NULL,
	"last_sync_at" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_error" text,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "strava_connection" ADD CONSTRAINT "strava_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;