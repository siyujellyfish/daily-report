CREATE TABLE "report_categories" (
	"slug" varchar(80) PRIMARY KEY NOT NULL,
	"label" varchar(120) NOT NULL,
	"description" varchar(500) NOT NULL,
	"sort_order" integer,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "report_categories" (
	"slug",
	"label",
	"description",
	"sort_order"
) VALUES
	(
		'daily-news',
		'資訊新聞',
		'回顧 AI、網頁開發與工具生態的每日觀察。',
		10
	),
	(
		'framework-recommendation',
		'框架工具',
		'每天認識一項工具，找到適合專案的下一個選擇。',
		20
	);
--> statement-breakpoint
ALTER TABLE "reports"
	ALTER COLUMN "report_type" TYPE varchar(80)
	USING "report_type"::text;
--> statement-breakpoint
ALTER TABLE "reports"
	ADD CONSTRAINT "reports_report_type_report_categories_slug_fk"
	FOREIGN KEY ("report_type")
	REFERENCES "public"."report_categories"("slug")
	ON DELETE RESTRICT
	ON UPDATE CASCADE;
--> statement-breakpoint
DROP TYPE "public"."report_type";
