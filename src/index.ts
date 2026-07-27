import { Hono } from "hono";
import { createLinkCardFromUrl, type Fetcher } from "./link-card";

export const createApp = (fetcher: Fetcher = fetch) => {
	const app = new Hono<{ Bindings: CloudflareBindings }>();

	app.get("/", async (c) => {
		const urlText = c.req.query("url");
		if (urlText === undefined) {
			return c.body(null, 400);
		}

		let url: URL;
		try {
			url = new URL(urlText);
		} catch {
			return c.body(null, 400);
		}

		const linkCard = await createLinkCardFromUrl(url, fetcher);
		return c.json(linkCard, 200, {
			"cache-control": "public, max-age=86400",
		});
	});

	return app;
};

export default createApp();
