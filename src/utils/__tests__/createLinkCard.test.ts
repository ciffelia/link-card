import { describe, expect, it } from 'vitest';
import { LinkCard } from '@/types/LinkCard';
import {
  createLinkCardFromHtml,
  createLinkCardFromUrl,
} from '../createLinkCard';

describe('createLinkCardFromUrl()', () => {
  it('should return a LinkCard object for valid pages', async () => {
    expect(
      await createLinkCardFromUrl(new URL('http://example.com/')),
    ).toStrictEqual({
      url: 'http://example.com/',
      title: 'Example Domain',
      description: undefined,
      faviconUrl: 'http://example.com/favicon.ico',
      ogImageUrl: undefined,
    } satisfies LinkCard);

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

  it('should return a LinkCard object for invalid pages', async () => {
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

    // Network Error
    expect(
      await createLinkCardFromUrl(new URL('http://example.invalid/')),
    ).toStrictEqual({
      url: 'http://example.invalid/',
    } satisfies LinkCard);
  });
});

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
