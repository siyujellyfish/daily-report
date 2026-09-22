ALTER TABLE "reports"
	ADD COLUMN "summary" text,
	ADD COLUMN "reading_minutes" integer,
	ADD COLUMN "headings" jsonb;
