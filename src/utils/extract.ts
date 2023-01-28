import type * as cheerio from 'cheerio';
import { fallback } from '@/utils/fallback';

export const extractTitle = ($: cheerio.CheerioAPI): string | undefined =>
  fallback(extractOpenGraphProperty($, 'title'), $('title').text());

export const extractDescription = ($: cheerio.CheerioAPI): string | undefined =>
  fallback(
    extractOpenGraphProperty($, 'description'),
    $('meta[name="description"]').attr('content'),
  );

export const extractOpenGraphImageUrl = (
  $: cheerio.CheerioAPI,
): URL | undefined => {
  const urlText = extractOpenGraphProperty($, 'image');
  if (urlText === undefined) {
    return undefined;
  }

  try {
    return new URL(urlText);
  } catch {
    return undefined;
  }
};

export const extractOpenGraphProperty = (
  $: cheerio.CheerioAPI,
  property: string,
): string | undefined =>
  fallback(
    $(`meta[property="og:${property}"]`).attr('content'),
    $(`meta[property="twitter:${property}"]`).attr('content'),
  );

export const extractFaviconUrl = (
  $: cheerio.CheerioAPI,
  pageUrl: URL,
): URL | undefined => {
  const faviconHref = $('link[rel~="icon"]').attr('href') ?? '/favicon.ico';

  const baseUrl = extractBaseUrl($, pageUrl);
  try {
    return new URL(faviconHref, baseUrl);
  } catch {
    return undefined;
  }
};

export const extractBaseUrl = ($: cheerio.CheerioAPI, pageUrl: URL): URL => {
  const baseHref = $('base').attr('href');
  if (baseHref === undefined) {
    return pageUrl;
  }

  try {
    return new URL(baseHref, pageUrl);
  } catch {
    return pageUrl;
  }
};
