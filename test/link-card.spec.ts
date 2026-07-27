import { describe, expect, it, vi } from "vitest";
import { createLinkCardFromHtml, createLinkCardFromUrl } from "../src/link-card";

describe("createLinkCardFromHtml", () => {
	it("uses the page URL and default favicon when metadata is absent", async () => {
		await expect(
			createLinkCardFromHtml("", new URL("https://link-card.example/article/cat")),
		).resolves.toEqual({
			url: "https://link-card.example/article/cat",
			faviconUrl: "https://link-card.example/favicon.ico",
		});
	});

	it("extracts fallback metadata", async () => {
		const html = `
			<!doctype html>
			<html>
				<head>
					<link rel="icon" href="/static/favicon.png">
					<meta name="description" content="私はその人を常に先生と呼んでいた。">
					<title>こころ - 夏目漱石</title>
				</head>
			</html>
		`;

		await expect(
			createLinkCardFromHtml(html, new URL("https://link-card.example/article/kokoro")),
		).resolves.toEqual({
			url: "https://link-card.example/article/kokoro",
			title: "こころ - 夏目漱石",
			description: "私はその人を常に先生と呼んでいた。",
			faviconUrl: "https://link-card.example/static/favicon.png",
		});
	});

	it("applies Open Graph, Twitter, and HTML metadata precedence", async () => {
		const result = await createLinkCardFromHtml(
			`
				<title>HTML title</title>
				<meta name="description" content="HTML description">
				<meta property="twitter:title" content="Twitter title">
				<meta property="twitter:description" content="Twitter description">
				<meta property="twitter:image" content="https://images.example/twitter.png">
				<meta property="og:title" content="Open Graph title">
				<meta property="og:description" content="Open Graph description">
				<meta property="og:image" content="https://images.example/open-graph.png">
			`,
			new URL("https://link-card.example/article"),
		);

		expect(result).toEqual({
			url: "https://link-card.example/article",
			title: "Open Graph title",
			description: "Open Graph description",
			faviconUrl: "https://link-card.example/favicon.ico",
			ogImageUrl: "https://images.example/open-graph.png",
		});
	});

	it("falls back through empty metadata values", async () => {
		const result = await createLinkCardFromHtml(
			`
				<title>HTML title</title>
				<meta name="description" content="HTML description">
				<meta property="twitter:title" content="Twitter title">
				<meta property="twitter:description" content="Twitter description">
				<meta property="twitter:image" content="https://images.example/twitter.png">
				<meta property="og:title" content="">
				<meta property="og:description" content="">
				<meta property="og:image" content="">
			`,
			new URL("https://link-card.example/article"),
		);

		expect(result.title).toBe("Twitter title");
		expect(result.description).toBe("Twitter description");
		expect(result.ogImageUrl).toBe("https://images.example/twitter.png");
	});

	it("honors the base URL when resolving the favicon", async () => {
		const result = await createLinkCardFromHtml(
			`
				<base href="/article/">
				<link rel="icon" href="images/favicon.png">
			`,
			new URL("https://link-card.example/original/detail.html"),
		);

		expect(result.faviconUrl).toBe("https://link-card.example/article/images/favicon.png");
	});

	it("uses the first repeated metadata value and preserves Unicode", async () => {
		const result = await createLinkCardFromHtml(
			`
				<meta property="og:title" content="こんにちは👩🏻‍👩🏻‍👧🏻‍👧🏻">
				<meta property="og:title" content="ignored">
			`,
			new URL("https://link-card.example/"),
		);

		expect(result.title).toBe("こんにちは👩🏻‍👩🏻‍👧🏻‍👧🏻");
	});

	it("ignores relative Open Graph image URLs", async () => {
		const result = await createLinkCardFromHtml(
			'<meta property="og:image" content="/og.png">',
			new URL("https://link-card.example/article"),
		);

		expect(result.ogImageUrl).toBeUndefined();
	});

	it.each([
		["shortcut icon", "https://link-card.example/article/assets/icon.png"],
		["icon", "https://link-card.example/article/assets/icon.png"],
	])("supports rel=%s links", async (rel, expected) => {
		const result = await createLinkCardFromHtml(
			`<link rel="${rel}" href="assets/icon.png">`,
			new URL("https://link-card.example/article/"),
		);

		expect(result.faviconUrl).toBe(expected);
	});

	it.each([
		["https://link-card.example/article/", "https://link-card.example/article/assets/icon.png"],
		["https://link-card.example/article", "https://link-card.example/assets/icon.png"],
	])("resolves relative favicon URLs against %s", async (url, expected) => {
		const result = await createLinkCardFromHtml(
			'<link rel="icon" href="assets/icon.png">',
			new URL(url),
		);

		expect(result.faviconUrl).toBe(expected);
	});

	it("ignores an invalid favicon URL", async () => {
		const result = await createLinkCardFromHtml(
			'<link rel="icon" href="///">',
			new URL("https://link-card.example/"),
		);

		expect(result.faviconUrl).toBeUndefined();
	});

	it("falls back to the page URL when the base URL is invalid", async () => {
		const result = await createLinkCardFromHtml(
			`
				<base href="///">
				<link rel="icon" href="assets/icon.png">
			`,
			new URL("https://link-card.example/article/"),
		);

		expect(result.faviconUrl).toBe("https://link-card.example/article/assets/icon.png");
	});

	it("limits text and metadata URL lengths", async () => {
		const longText = "a".repeat(9_000);
		const result = await createLinkCardFromHtml(
			`
				<title>${longText}</title>
				<meta name="description" content="${longText}">
				<link rel="icon" href="https://images.example/${longText}">
				<meta property="og:image" content="https://images.example/${longText}">
			`,
			new URL("https://link-card.example/"),
		);

		expect(result.title).toHaveLength(256);
		expect(result.description).toHaveLength(256);
		expect(result.faviconUrl).toHaveLength(8_192);
		expect(result.ogImageUrl).toHaveLength(8_192);
	});
});

describe("createLinkCardFromUrl", () => {
	it("fetches with explicit content negotiation and user agent headers", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			new Response("<title>Example</title>", {
				headers: { "content-type": "text/html" },
			}),
		);
		const url = new URL("https://example.com/");

		await expect(createLinkCardFromUrl(url, fetcher)).resolves.toEqual({
			url: "https://example.com/",
			title: "Example",
			faviconUrl: "https://example.com/favicon.ico",
		});
		expect(fetcher).toHaveBeenCalledOnce();
		expect(fetcher).toHaveBeenCalledWith(url, {
			headers: {
				accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
				"user-agent": "link-card/1.0",
			},
		});
	});

	it("returns a minimal card when fetching fails", async () => {
		const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("failed"));

		await expect(
			createLinkCardFromUrl(new URL("https://unavailable.example/"), fetcher),
		).resolves.toEqual({
			url: "https://unavailable.example/",
		});
	});
});
