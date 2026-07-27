export interface LinkCard {
	url: string;
	title?: string;
	description?: string;
	faviconUrl?: string;
	ogImageUrl?: string;
}

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const MAX_TEXT_LENGTH = 256;
const MAX_URL_LENGTH = 8192;

const fallback = (...values: Array<string | undefined>): string | undefined =>
	values.find((value) => value !== undefined && value !== "");

const toUrl = (value: string | undefined, base?: URL): URL | undefined => {
	if (value === undefined) {
		return undefined;
	}

	try {
		return new URL(value, base);
	} catch {
		return undefined;
	}
};

const consumeBody = async (response: Response): Promise<void> => {
	const reader = response.body?.getReader();
	if (reader === undefined) {
		return;
	}

	while (!(await reader.read()).done) {
		// HTMLRewriter runs its handlers as the transformed body is consumed.
	}
};

interface Metadata {
	baseHref?: string;
	description?: string;
	faviconHref?: string;
	openGraphDescription?: string;
	openGraphImage?: string;
	openGraphTitle?: string;
	title: string;
	twitterDescription?: string;
	twitterImage?: string;
	twitterTitle?: string;
}

const captureFirstAttribute = (
	metadata: Metadata,
	key: keyof Metadata,
	attribute: string,
): HTMLRewriterElementContentHandlers => ({
	element(element) {
		if (metadata[key] === undefined) {
			const value = element.getAttribute(attribute);
			if (value !== null) {
				metadata[key] = value;
			}
		}
	},
});

export const createLinkCardFromResponse = async (
	response: Response,
	pageUrl: URL,
): Promise<LinkCard> => {
	const metadata: Metadata = { title: "" };
	const transformedResponse = new HTMLRewriter()
		.on("title", {
			text(text) {
				if (metadata.title.length < MAX_TEXT_LENGTH) {
					metadata.title = (metadata.title + text.text).slice(0, MAX_TEXT_LENGTH);
				}
			},
		})
		.on('meta[property="og:title"]', captureFirstAttribute(metadata, "openGraphTitle", "content"))
		.on(
			'meta[property="twitter:title"]',
			captureFirstAttribute(metadata, "twitterTitle", "content"),
		)
		.on(
			'meta[property="og:description"]',
			captureFirstAttribute(metadata, "openGraphDescription", "content"),
		)
		.on(
			'meta[property="twitter:description"]',
			captureFirstAttribute(metadata, "twitterDescription", "content"),
		)
		.on('meta[name="description"]', captureFirstAttribute(metadata, "description", "content"))
		.on('meta[property="og:image"]', captureFirstAttribute(metadata, "openGraphImage", "content"))
		.on(
			'meta[property="twitter:image"]',
			captureFirstAttribute(metadata, "twitterImage", "content"),
		)
		.on('link[rel~="icon"]', captureFirstAttribute(metadata, "faviconHref", "href"))
		.on("base", captureFirstAttribute(metadata, "baseHref", "href"))
		.transform(response);

	await consumeBody(transformedResponse);

	const title = fallback(metadata.openGraphTitle, metadata.twitterTitle, metadata.title);
	const description = fallback(
		metadata.openGraphDescription,
		metadata.twitterDescription,
		metadata.description,
	);
	const baseUrl = toUrl(metadata.baseHref, pageUrl) ?? pageUrl;
	const faviconUrl = toUrl(metadata.faviconHref ?? "/favicon.ico", baseUrl);
	const ogImageUrl = toUrl(fallback(metadata.openGraphImage, metadata.twitterImage));
	const linkCard: LinkCard = { url: pageUrl.toString() };

	if (title !== undefined) {
		linkCard.title = title.slice(0, MAX_TEXT_LENGTH);
	}
	if (description !== undefined) {
		linkCard.description = description.slice(0, MAX_TEXT_LENGTH);
	}
	if (faviconUrl !== undefined) {
		linkCard.faviconUrl = faviconUrl.toString().slice(0, MAX_URL_LENGTH);
	}
	if (ogImageUrl !== undefined) {
		linkCard.ogImageUrl = ogImageUrl.toString().slice(0, MAX_URL_LENGTH);
	}

	return linkCard;
};

export const createLinkCardFromHtml = (html: string, pageUrl: URL): Promise<LinkCard> =>
	createLinkCardFromResponse(
		new Response(html, {
			headers: { "content-type": "text/html; charset=utf-8" },
		}),
		pageUrl,
	);

export const createLinkCardFromUrl = async (
	url: URL,
	fetcher: Fetcher = fetch,
): Promise<LinkCard> => {
	try {
		const response = await fetcher(url, {
			headers: {
				accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
				"user-agent": "link-card/1.0",
			},
		});
		return await createLinkCardFromResponse(response, url);
	} catch (error) {
		console.error(
			JSON.stringify({
				message: "link card request failed",
				url: url.toString(),
				error: {
					name: error instanceof Error ? error.name : "UnknownError",
					message: error instanceof Error ? error.message : String(error),
				},
			}),
		);
		return { url: url.toString() };
	}
};
