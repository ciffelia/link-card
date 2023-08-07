import { describe, it } from 'vitest';
import ky from 'ky';

describe.concurrent(
  '/',
  () => {
    if (process.env.LINK_CARD_TEST_URL === undefined) {
      throw new Error('LINK_CARD_TEST_URL is not set.');
    }
    const baseUrl = new URL(process.env.LINK_CARD_TEST_URL);

    const cases = [
      'http://example.com/',
      'https://ogp.me/',
      'https://www.w3.org/',
      'https://ogp.me/foobarbaz',
      'https://ogp.me/logo.png',
      'http://example.invalid/',
    ] as const satisfies readonly string[];

    for (const url of cases) {
      it(`should return a LinkCard object for ${url}`, async ({ expect }) => {
        const endpointUrl = new URL(baseUrl);
        endpointUrl.searchParams.set('url', url);
        expect(await ky(endpointUrl).json()).toMatchSnapshot();
      });
    }

    it('should return 400 for requests with no url parameter', async ({
      expect,
    }) => {
      const resp = await ky(baseUrl, { throwHttpErrors: false });
      expect(resp.status).toBe(400);
    });

    it('should return 400 for requests with an invalid url parameter', async ({
      expect,
    }) => {
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
