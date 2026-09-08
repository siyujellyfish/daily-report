import {
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const reportTypeEnum = pgEnum("report_type", [
	"daily-news",
	"framework-recommendation",
]);

export type ReportSource = {
	title: string;
	url: string;
};

export const reports = pgTable(
	"reports",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schemaVersion: integer("schema_version").default(1).notNull(),
		reportType: reportTypeEnum("report_type").notNull(),
		reportDate: date("report_date", { mode: "string" }).notNull(),
		title: varchar("title", { length: 300 }).notNull(),
		contentMarkdown: text("content_markdown").notNull(),
		sources: jsonb("sources").$type<ReportSource[]>().notNull(),
		generatedAt: timestamp("generated_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
		receivedAt: timestamp("received_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),
		payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
	},
	(table) => [
		unique("reports_type_date_unique").on(table.reportType, table.reportDate),
		unique("reports_payload_hash_unique").on(table.payloadHash),
		index("reports_date_idx").on(table.reportDate),
		index("reports_type_date_idx").on(table.reportType, table.reportDate),
	],
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
