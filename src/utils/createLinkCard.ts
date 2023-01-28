import ky from 'ky';
import * as cheerio from 'cheerio';
import { type LinkCard } from '@/types/LinkCard';
import {
  extractDescription,
  extractFaviconUrl,
  extractOpenGraphImageUrl,
  extractTitle,
} from './extract';

export const createLinkCardFromUrl = async (url: URL): Promise<LinkCard> => {
  let html: string;
  try {
    html = await ky(url, { throwHttpErrors: false }).text();
  } catch {
    return { url: url.toString() };
  }

  return createLinkCardFromHtml(html, url);
};

export const createLinkCardFromHtml = (html: string, url: URL): LinkCard => {
  const $ = cheerio.load(html);

  const title = extractTitle($);
  const description = extractDescription($);
  const faviconUrl = extractFaviconUrl($, url);
  const ogImageUrl = extractOpenGraphImageUrl($);

  return {
    url: url.toString(),
    title: title?.slice(0, 256),
    description: description?.slice(0, 256),
    faviconUrl: faviconUrl?.toString()?.slice(0, 8192),
    ogImageUrl: ogImageUrl?.toString()?.slice(0, 8192),
  };
};
