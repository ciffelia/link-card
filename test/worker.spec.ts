import { exports } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchWorker = (path: string, init?: RequestInit) =>
	exports.default.fetch(new Request(`https://worker.example${path}`, init));

afterEach(() => {
	vi.restoreAllMocks();
});

describe("link card worker", () => {
	it("returns 400 with an empty body when the url query parameter is missing", async () => {
		const response = await fetchWorker("/");

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("");
	});

	it("returns 400 with an empty body when the url query parameter is invalid", async () => {
		const response = await fetchWorker("/?url=invalid");

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("");
	});

	it("only exposes the endpoint over GET", async () => {
		const response = await fetchWorker("/?url=https%3A%2F%2Fexample.com%2F", {
			method: "POST",
		});

		expect(response.status).toBe(404);
	});

	it("returns the link card JSON and cache policy", async () => {
		const fetcher = vi.fn<typeof fetch>().mockImplementation(
			async () =>
				new Response("<title>Example</title>", {
					headers: { "content-type": "text/html" },
				}),
		);
		vi.spyOn(globalThis, "fetch").mockImplementation(fetcher);

		const response = await fetchWorker("/?url=https%3A%2F%2Fexample.com%2F");

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
		await expect(response.json()).resolves.toEqual({
			url: "https://example.com/",
			title: "Example",
			faviconUrl: "https://example.com/favicon.ico",
		});
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it("returns a minimal card when the upstream request fails", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("unavailable"));
		vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await fetchWorker("/?url=https%3A%2F%2Funavailable.example%2F");

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			url: "https://unavailable.example/",
		});
	});
});
