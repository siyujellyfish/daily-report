import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

import type { ReportType } from "@/lib/report-types";
import type { ReportHeading } from "@/lib/report-markdown";

export type ReportSource = {
	title: string;
	url: string;
};

export const reportCategories = pgTable("report_categories", {
	slug: varchar("slug", { length: 80 }).primaryKey(),
	label: varchar("label", { length: 120 }).notNull(),
	description: varchar("description", { length: 500 }).notNull(),
	sortOrder: integer("sort_order"),
	isVisible: boolean("is_visible").default(true).notNull(),
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date",
	})
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "date",
	})
		.defaultNow()
		.notNull(),
});

export const reports = pgTable(
	"reports",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schemaVersion: integer("schema_version").default(1).notNull(),
		reportType: varchar("report_type", { length: 80 })
			.$type<ReportType>()
			.notNull()
			.references(() => reportCategories.slug, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		reportDate: date("report_date", { mode: "string" }).notNull(),
		title: varchar("title", { length: 300 }).notNull(),
		contentMarkdown: text("content_markdown").notNull(),
		summary: text("summary"),
		readingMinutes: integer("reading_minutes"),
		headings: jsonb("headings").$type<ReportHeading[]>(),
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

export type ReportCategory = typeof reportCategories.$inferSelect;
export type NewReportCategory = typeof reportCategories.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
