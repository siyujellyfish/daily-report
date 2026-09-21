export function truncateCategoryLabel(label: string, maxLength = 5) {
	const characters = Array.from(label);
	if (characters.length <= maxLength) return label;
	return `${characters.slice(0, maxLength).join("")}…`;
}
