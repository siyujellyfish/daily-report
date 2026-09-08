export default function Home() {
	return (
		<main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
		<header className="space-y-3">
			<p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
				Daily Report
			</p>
			<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
				每日資訊新聞與框架工具推薦
			</h1>
			<p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
				本網站將接收 ChatGPT Scheduled Tasks 經由 Make 傳送的每日內容。
			</p>
		</header>

		<section className="grid gap-4 sm:grid-cols-2">
			<article className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
				<h2 className="text-xl font-semibold">每日資訊新聞</h2>
				<p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
					等待第一筆正式資料寫入。
				</p>
			</article>

			<article className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
				<h2 className="text-xl font-semibold">每日框架工具推薦</h2>
				<p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
					等待第一筆正式資料寫入。
				</p>
			</article>
		</section>
	</main>
	);
}
