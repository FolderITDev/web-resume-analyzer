CREATE TYPE "public"."analysis_stage" AS ENUM('received', 'extracting', 'parsing', 'matching', 'scoring', 'done');--> statement-breakpoint
CREATE TYPE "public"."analysis_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('pdf', 'docx');--> statement-breakpoint
CREATE TYPE "public"."grade" AS ENUM('excellent', 'strong', 'fair', 'needs-work');--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_hash" text,
	"is_example" boolean DEFAULT false NOT NULL,
	"status" "analysis_status" DEFAULT 'queued' NOT NULL,
	"stage" "analysis_stage" DEFAULT 'received' NOT NULL,
	"file_name" text NOT NULL,
	"file_type" "file_type" NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"job_title" text,
	"has_job_description" boolean DEFAULT false NOT NULL,
	"score" smallint,
	"grade" "grade",
	"report" jsonb,
	"engine_version" text,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "analyses_score_range" CHECK ("analyses"."score" IS NULL OR "analyses"."score" BETWEEN 0 AND 100),
	CONSTRAINT "analyses_owner_or_example" CHECK (("analyses"."is_example" AND "analyses"."owner_hash" IS NULL) OR (NOT "analyses"."is_example" AND "analyses"."owner_hash" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX "analyses_owner_created_idx" ON "analyses" USING btree ("owner_hash","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analyses_example_created_idx" ON "analyses" USING btree ("is_example","created_at" DESC NULLS LAST);