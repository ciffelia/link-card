import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import app, { createApp } from "../src/index";
import { createLinkCardFromHtml, createLinkCardFromUrl } from "../src/link-card";

describe("link card worker", () => {
	it("returns 400 when the url query parameter is missing", async () => {
		const response = await app.request("/", {}, env);

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("");
	});

	it("returns 400 when the url query parameter is invalid", async () => {
		const response = await app.request("/?url=invalid", {}, env);

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("");
	});

	it("returns a link card with the legacy cache policy", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			new Response("<title>Example</title>", {
				headers: { "content-type": "text/html" },
			}),
		);
		const testApp = createApp(fetcher);
		const response = await testApp.request("/?url=https%3A%2F%2Fexample.com%2F", {}, env);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
		await expect(response.json()).resolves.toEqual({
			url: "https://example.com/",
			title: "Example",
			faviconUrl: "https://example.com/favicon.ico",
		});
	});
});

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

	it("prefers Open Graph metadata and honors the base URL", async () => {
		const html = `
			<!doctype html>
			<html>
				<head>
					<base href="/article/">
					<link rel="icon" href="images/favicon.png">
					<meta name="description" content="fallback">
					<title>fallback title</title>
					<meta property="og:title" content="こころ">
					<meta property="og:description" content="私はその人を常に先生と呼んでいた。">
					<meta property="og:image" content="https://link-card.example/static/og.png">
				</head>
			</html>
		`;

		await expect(
			createLinkCardFromHtml(html, new URL("https://link-card.example/article/kokoro/detail.html")),
		).resolves.toEqual({
			url: "https://link-card.example/article/kokoro/detail.html",
			title: "こころ",
			description: "私はその人を常に先生と呼んでいた。",
			faviconUrl: "https://link-card.example/article/images/favicon.png",
			ogImageUrl: "https://link-card.example/static/og.png",
		});
	});

	it("ignores invalid absolute Open Graph image URLs", async () => {
		await expect(
			createLinkCardFromHtml(
				'<meta property="og:image" content="/og.png">',
				new URL("https://link-card.example/article"),
			),
		).resolves.toEqual({
			url: "https://link-card.example/article",
			faviconUrl: "https://link-card.example/favicon.ico",
		});
	});

	it("limits title and description lengths", async () => {
		const longText = "a".repeat(300);
		const result = await createLinkCardFromHtml(
			`<title>${longText}</title><meta name="description" content="${longText}">`,
			new URL("https://link-card.example/"),
		);

		expect(result.title).toHaveLength(256);
		expect(result.description).toHaveLength(256);
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

	it("supports shortcut icon links", async () => {
		const result = await createLinkCardFromHtml(
			'<link rel="shortcut icon" href="assets/icon.png">',
			new URL("https://link-card.example/article/"),
		);

		expect(result.faviconUrl).toBe("https://link-card.example/article/assets/icon.png");
	});

	it("ignores invalid favicon URLs", async () => {
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
});

describe("createLinkCardFromUrl", () => {
	it("returns a minimal card when fetching fails", async () => {
		const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("failed"));

		await expect(
			createLinkCardFromUrl(new URL("https://unavailable.example/"), fetcher),
		).resolves.toEqual({
			url: "https://unavailable.example/",
		});
	});

	it("fetches and parses a URL", async () => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			new Response("<title>Example</title>", {
				headers: { "content-type": "text/html" },
			}),
		);

		await expect(createLinkCardFromUrl(new URL("https://example.com/"), fetcher)).resolves.toEqual({
			url: "https://example.com/",
			title: "Example",
			faviconUrl: "https://example.com/favicon.ico",
		});
		expect(fetcher).toHaveBeenCalledOnce();
	});
});
