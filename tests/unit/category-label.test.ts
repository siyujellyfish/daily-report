import { describe, expect, it } from "vitest";

import { truncateCategoryLabel } from "@/lib/category-label";

describe("truncateCategoryLabel", () => {
	it("keeps labels up to five characters unchanged", () => {
		expect(truncateCategoryLabel("資訊新聞")).toBe("資訊新聞");
		expect(truncateCategoryLabel("框架工具")).toBe("框架工具");
	});

	it("truncates longer labels to five characters plus an ellipsis", () => {
		expect(truncateCategoryLabel("這是一個用於驗證")).toBe("這是一個用…");
	});
});
