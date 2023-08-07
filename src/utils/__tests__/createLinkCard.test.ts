import { describe, it } from 'vitest';
import {
  createLinkCardFromHtml,
  createLinkCardFromUrl,
} from '../createLinkCard';

describe.concurrent(
  'createLinkCardFromUrl()',
  () => {
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
        expect(await createLinkCardFromUrl(new URL(url))).toMatchSnapshot();
      });
    }
  },
  {
    timeout: 10000,
    retry: 3,
  },
);

describe('createLinkCardFromHtml()', () => {
  const cases = [
    ['', 'https://link-card.example/article/cat'],
    [
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
      'https://link-card.example/article/kokoro',
    ],
    [
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
      'https://link-card.example/article/kokoro/detail.html',
    ],
  ] as const satisfies ReadonlyArray<readonly [string, string]>;

  for (const [i, [html, url]] of cases.entries()) {
    it(`should return a LinkCard object #{${i + 1}}`, ({ expect }) => {
      expect(createLinkCardFromHtml(html, new URL(url))).toMatchSnapshot();
    });
  }
});
