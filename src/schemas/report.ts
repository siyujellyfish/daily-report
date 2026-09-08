import { z } from "zod";

const sourceSchema = z.object({
	title: z.string().trim().min(1).max(300),
	url: z.url({ protocol: /^https?$/ }),
});

export const reportIngestSchema = z
	.object({
		schemaVersion: z.literal(1),
		reportType: z.enum(["daily-news", "framework-recommendation"]),
		title: z.string().trim().min(1).max(300),
		generatedAt: z.iso.datetime({ offset: true }),
		contentMarkdown: z.string().min(1).max(500_000),
		sources: z
			.array(sourceSchema)
			.max(100)
			.nullish()
			.transform((sources) => sources ?? []),
	})
	.strict();

export type ReportIngestInput = z.infer<typeof reportIngestSchema>;
