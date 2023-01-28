import { describe, expect, it } from 'vitest';
import { type LinkCard } from '@/types/LinkCard';
import {
  createLinkCardFromHtml,
  createLinkCardFromUrl,
} from '../createLinkCard';

describe.concurrent(
  'createLinkCardFromUrl()',
  () => {
    it('should return a LinkCard object for http://example.com/', async () => {
      expect(
        await createLinkCardFromUrl(new URL('http://example.com/')),
      ).toStrictEqual({
        url: 'http://example.com/',
        title: 'Example Domain',
        description: undefined,
        faviconUrl: 'http://example.com/favicon.ico',
        ogImageUrl: undefined,
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://ogp.me/', async () => {
      expect(
        await createLinkCardFromUrl(new URL('https://ogp.me/')),
      ).toStrictEqual({
        url: 'https://ogp.me/',
        title: 'Open Graph protocol',
        description:
          'The Open Graph protocol enables any web page to become a rich object in a social graph.',
        faviconUrl: 'https://ogp.me/favicon.ico',
        ogImageUrl: 'https://ogp.me/logo.png',
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://www.w3.org/', async () => {
      expect(
        await createLinkCardFromUrl(new URL('https://www.w3.org/')),
      ).toStrictEqual({
        url: 'https://www.w3.org/',
        title: 'World Wide Web Consortium (W3C)',
        description:
          'The World Wide Web Consortium (W3C) is an international community where Member organizations, a full-time staff, and the public work together to develop Web standards.',
        faviconUrl: 'https://www.w3.org/2008/site/images/favicon.ico',
        ogImageUrl: undefined,
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://ogp.me/foobarbaz', async () => {
      // Not Found
      expect(
        await createLinkCardFromUrl(new URL('https://ogp.me/foobarbaz')),
      ).toStrictEqual({
        url: 'https://ogp.me/foobarbaz',
        title: undefined,
        description: undefined,
        faviconUrl: 'https://ogp.me/favicon.ico',
        ogImageUrl: undefined,
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for https://ogp.me/logo.png', async () => {
      // Not HTML
      expect(
        await createLinkCardFromUrl(new URL('https://ogp.me/logo.png')),
      ).toStrictEqual({
        url: 'https://ogp.me/logo.png',
        title: undefined,
        description: undefined,
        faviconUrl: 'https://ogp.me/favicon.ico',
        ogImageUrl: undefined,
      } satisfies LinkCard);
    });

    it('should return a LinkCard object for http://example.invalid/', async () => {
      // Network Error
      expect(
        await createLinkCardFromUrl(new URL('http://example.invalid/')),
      ).toStrictEqual({
        url: 'http://example.invalid/',
      } satisfies LinkCard);
    });
  },
  {
    timeout: 10000,
    retry: 3,
  },
);

describe('createLinkCardFromHtml()', () => {
  it('should return a LinkCard object', () => {
    expect(
      createLinkCardFromHtml(
        '',
        new URL('https://link-card.example/article/cat'),
      ),
    ).toStrictEqual({
      url: 'https://link-card.example/article/cat',
      title: undefined,
      description: undefined,
      faviconUrl: 'https://link-card.example/favicon.ico',
      ogImageUrl: undefined,
    } satisfies LinkCard);

    expect(
      createLinkCardFromHtml(
        `
        <!doctype html>
        <html>
          <head>
            <link rel="icon" href="/static/favicon.png">
            <meta name="description" content="私はその人を常に先生と呼んでいた。">
            <title>こころ - 夏目漱石</title>
          </head>        
        </html>
      `,
        new URL('https://link-card.example/article/kokoro'),
      ),
    ).toStrictEqual({
      url: 'https://link-card.example/article/kokoro',
      title: 'こころ - 夏目漱石',
      description: '私はその人を常に先生と呼んでいた。',
      faviconUrl: 'https://link-card.example/static/favicon.png',
      ogImageUrl: undefined,
    } satisfies LinkCard);

    expect(
      createLinkCardFromHtml(
        `
        <!doctype html>
        <html>
          <head>
            <base href="/article/">
            <link rel="icon" href="images/favicon.png">
            <meta name="description" content="私はその人を常に先生と呼んでいた。">
            <title>こころ - 夏目漱石</title>
            <meta property="og:title" content="こころ">
            <meta property="og:description" content="私はその人を常に先生と呼んでいた。だからここでもただ先生と書くだけで本名は打ち明けない。">
            <meta property="og:image" content="https://link-card.example/static/og.png">
          </head>        
        </html>
      `,
        new URL('https://link-card.example/article/kokoro/detail.html'),
      ),
    ).toStrictEqual({
      url: 'https://link-card.example/article/kokoro/detail.html',
      title: 'こころ',
      description:
        '私はその人を常に先生と呼んでいた。だからここでもただ先生と書くだけで本名は打ち明けない。',
      faviconUrl: 'https://link-card.example/article/images/favicon.png',
      ogImageUrl: 'https://link-card.example/static/og.png',
    } satisfies LinkCard);
  });
});
