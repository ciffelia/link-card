import { describe, expect, it } from 'vitest';
import ky from 'ky';
import { LinkCard } from '@/types/LinkCard';

describe('/', () => {
  if (process.env.LINK_CARD_TEST_URL === undefined) {
    throw new Error('LINK_CARD_TEST_URL is not set.');
  }
  const baseUrl = new URL(process.env.LINK_CARD_TEST_URL);

  const makeReq = async (urlParam: string): Promise<unknown> => {
    const url = new URL(baseUrl);
    url.searchParams.set('url', urlParam);
    return await ky(url).json();
  };

  it('should return a LinkCard object for valid pages', async () => {
    expect(await makeReq('http://example.com/')).toStrictEqual({
      url: 'http://example.com/',
      title: 'Example Domain',
      faviconUrl: 'http://example.com/favicon.ico',
    } satisfies LinkCard);

    expect(await makeReq('https://ogp.me/')).toStrictEqual({
      url: 'https://ogp.me/',
      title: 'Open Graph protocol',
      description:
        'The Open Graph protocol enables any web page to become a rich object in a social graph.',
      faviconUrl: 'https://ogp.me/favicon.ico',
      ogImageUrl: 'https://ogp.me/logo.png',
    } satisfies LinkCard);
  });

  it('should return a LinkCard object for invalid pages', async () => {
    // Not Found
    expect(await makeReq('https://ogp.me/foobarbaz')).toStrictEqual({
      url: 'https://ogp.me/foobarbaz',
      faviconUrl: 'https://ogp.me/favicon.ico',
    } satisfies LinkCard);

    // Not HTML
    expect(await makeReq('https://ogp.me/logo.png')).toStrictEqual({
      url: 'https://ogp.me/logo.png',
      faviconUrl: 'https://ogp.me/favicon.ico',
    } satisfies LinkCard);

    // Network Error
    expect(await makeReq('http://example.invalid/')).toStrictEqual({
      url: 'http://example.invalid/',
    } satisfies LinkCard);
  });
});
