import { exports } from "cloudflare:workers";
import { expect, it } from "vitest";

const urls = [
	"http://example.com/",
	"https://ogp.me/",
	"https://www.w3.org/",
	"https://ogp.me/foobarbaz",
	"https://ogp.me/logo.png",
	"http://example.invalid/",
] as const;

for (const url of urls) {
	it(`fetches ${url} through the Worker`, { retry: 3, timeout: 10_000 }, async () => {
		const endpointUrl = new URL("https://worker.example/");
		endpointUrl.searchParams.set("url", url);

		const response = await exports.default.fetch(endpointUrl);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchSnapshot();
	});
}
