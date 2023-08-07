import { describe, expect, it } from 'vitest';
import ky from 'ky';
import { type LinkCard } from '@/types/LinkCard';

describe.concurrent(
  '/',
  () => {
    if (process.env.LINK_CARD_TEST_URL === undefined) {
      throw new Error('LINK_CARD_TEST_URL is not set.');
    }
    const baseUrl = new URL(process.env.LINK_CARD_TEST_URL);

    const makeReq = async (urlParam: string): Promise<unknown> => {
      const url = new URL(baseUrl);
      url.searchParams.set('url', urlParam);
      return await ky(url).json();
    };

    it('should return a LinkCard object for http://example.com/', async () => {
      expect(await makeReq('http://example.com/')).toStrictEqual({
        url: 'http://example.com/',
        title: 'Example Domain',
        faviconUrl: 'http://example.com/favicon.ico',
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://ogp.me/', async () => {
      expect(await makeReq('https://ogp.me/')).toStrictEqual({
        url: 'https://ogp.me/',
        title: 'Open Graph protocol',
        description:
          'The Open Graph protocol enables any web page to become a rich object in a social graph.',
        faviconUrl: 'https://ogp.me/favicon.ico',
        ogImageUrl: 'https://ogp.me/logo.png',
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://www.w3.org/', async () => {
      expect(await makeReq('https://www.w3.org/')).toStrictEqual({
        url: 'https://www.w3.org/',
        title: 'W3C',
        description:
          'The World Wide Web Consortium (W3C) develops standards and guidelines to help everyone build a web based on the principles of accessibility, internationalization, privacy and security.',
        faviconUrl: 'https://www.w3.org/favicon.ico',
        ogImageUrl:
          'https://www.w3.org/assets/website-2021/images/w3c-opengraph-image.png',
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://ogp.me/foobarbaz', async () => {
      // Not Found
      expect(await makeReq('https://ogp.me/foobarbaz')).toStrictEqual({
        url: 'https://ogp.me/foobarbaz',
        faviconUrl: 'https://ogp.me/favicon.ico',
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://ogp.me/logo.png', async () => {
      // Not HTML
      expect(await makeReq('https://ogp.me/logo.png')).toStrictEqual({
        url: 'https://ogp.me/logo.png',
        faviconUrl: 'https://ogp.me/favicon.ico',
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for http://example.invalid/', async () => {
      // Network Error
      expect(await makeReq('http://example.invalid/')).toStrictEqual({
        url: 'http://example.invalid/',
      } satisfies LinkCard);
    });

    it('should return 400 for requests with no url parameter', async () => {
      const resp = await ky(baseUrl, { throwHttpErrors: false });
      expect(resp.status).toBe(400);
    });

    it('should return 400 for requests with an invalid url parameter', async () => {
      const url = new URL(baseUrl);
      url.searchParams.set('url', 'invalid');

      const resp = await ky(url, { throwHttpErrors: false });
      expect(resp.status).toBe(400);
    });
  },
  {
    timeout: 10000,
    retry: 3,
  },
);
