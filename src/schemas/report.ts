import { z } from "zod";

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const sourceSchema = z.object({
	title: z.string().trim().min(1).max(300),
	url: z.url({ protocol: /^https?$/ }),
});

const sourcesSchema = z
	.array(sourceSchema)
	.max(100)
	.nullish()
	.transform((sources) => sources ?? []);

export const categorySlugSchema = z
	.string()
	.min(1)
	.max(80)
	.regex(CATEGORY_SLUG_PATTERN);

export const reportIngestV1Schema = z
	.object({
		schemaVersion: z.literal(1),
		reportType: z.enum(["daily-news", "framework-recommendation"]),
		title: z.string().trim().min(1).max(300),
		generatedAt: z.iso.datetime({ offset: true }),
		contentMarkdown: z.string().min(1).max(500_000),
		sources: sourcesSchema,
	})
	.strict();

export const reportIngestV2Schema = z
	.object({
		schemaVersion: z.literal(2),
		reportType: categorySlugSchema,
		categoryLabel: z.string().trim().min(1).max(120),
		categoryDescription: z.string().trim().min(1).max(500),
		title: z.string().trim().min(1).max(300),
		generatedAt: z.iso.datetime({ offset: true }),
		contentMarkdown: z.string().min(1).max(500_000),
		sources: sourcesSchema,
	})
	.strict();

export const reportIngestSchema = z.discriminatedUnion("schemaVersion", [
	reportIngestV1Schema,
	reportIngestV2Schema,
]);

export type ReportIngestV1Input = z.infer<typeof reportIngestV1Schema>;
export type ReportIngestV2Input = z.infer<typeof reportIngestV2Schema>;
export type ReportIngestInput = z.infer<typeof reportIngestSchema>;
