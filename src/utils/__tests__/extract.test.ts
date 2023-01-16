import { describe, expect, it } from 'vitest';
import * as cheerio from 'cheerio';
import {
  extractBaseUrl,
  extractDescription,
  extractFaviconUrl,
  extractOpenGraphImageUrl,
  extractOpenGraphProperty,
  extractTitle,
} from '../extract';

describe('extractTitle()', () => {
  it('should return undefined when no title is available', () => {
    const $ = cheerio.load('<head></head>');
    expect(extractTitle($)).toBe(undefined);
  });

  it('should return a value from og:title', () => {
    const $ = cheerio.load(`
      <head>
        <title>Hello</title>
        <meta property="og:title" content="World!">
      </head>
    `);
    expect(extractTitle($)).toBe('World!');
  });

  it('should return a value from <title>', () => {
    const $ = cheerio.load(`
      <head>
        <title>タイトル</title>
      </head>
    `);
    expect(extractTitle($)).toBe('タイトル');
  });
});

describe('extractDescription()', () => {
  it('should return undefined when no description is available', () => {
    const $ = cheerio.load('<head></head>');
    expect(extractDescription($)).toBe(undefined);
  });

  it('should return a value from og:description', () => {
    const $ = cheerio.load(`
      <head>
        <meta name="description" content="吾輩は猫である。">
        <meta property="og:description" content="名前はまだ無い。">
      </head>
    `);
    expect(extractDescription($)).toBe('名前はまだ無い。');
  });

  it('should return a value from <meta name="description">', () => {
    const $ = cheerio.load(`
      <head>
        <meta name="description" content="Hello">
      </head>
    `);
    expect(extractDescription($)).toBe('Hello');
  });
});

describe('extractOpenGraphImageUrl()', () => {
  it('should return undefined when no images are available', () => {
    const $ = cheerio.load('<head></head>');
    expect(extractOpenGraphImageUrl($)).toBe(undefined);
  });

  it('should return undefined when an invalid URL is provided', () => {
    const $ = cheerio.load(`
      <head>
        <meta property="og:image" content="/og.png">
      </head>
    `);
    expect(extractOpenGraphImageUrl($)).toBe(undefined);
  });

  it('should return a value from og:image', () => {
    const $ = cheerio.load(`
      <head>
        <meta property="og:image" content="https://image.example/og1.png">
        <meta property="og:image" content="https://image.example/og2.jpg">
      </head>
    `);
    expect(extractOpenGraphImageUrl($)?.toString()).toBe(
      'https://image.example/og1.png',
    );
  });
});

describe('extractOpenGraphProperty()', () => {
  it('should return undefined when no value are available', () => {
    const $ = cheerio.load('<head></head>');
    expect(extractOpenGraphProperty($, 'foo')).toBe(undefined);
  });

  it('should return a value', () => {
    const $ = cheerio.load(`
      <head>
        <meta property="og:foo" content="bar">
      </head>
    `);
    expect(extractOpenGraphProperty($, 'foo')).toBe('bar');
  });

  it('should return the first value when multiple values are available', () => {
    const $ = cheerio.load(`
      <head>
        <meta property="og:foo" content="abc">
        <meta property="og:foo" content="xyz">
      </head>
    `);
    expect(extractOpenGraphProperty($, 'foo')).toBe('abc');
  });

  it('should return a value with unicode characters', () => {
    const $ = cheerio.load(`
      <head>
        <meta property="og:foo" content="こんにちは👩🏻‍👩🏻‍👧🏻‍👧🏻">
      </head>
    `);
    expect(extractOpenGraphProperty($, 'foo')).toBe('こんにちは👩🏻‍👩🏻‍👧🏻‍👧🏻');
  });
});

describe('extractFaviconUrl()', () => {
  it('should return /favicon.ico when no favicon is provided', () => {
    const $ = cheerio.load('<head></head>');
    expect(
      extractFaviconUrl($, new URL('http://favicon.example'))?.toString(),
    ).toBe('http://favicon.example/favicon.ico');
  });

  it('should return undefined when an invalid URL is provided', () => {
    const $ = cheerio.load('<head><link rel="icon" href="///"></head>');
    expect(
      extractFaviconUrl($, new URL('http://favicon.example'))?.toString(),
    ).toBe(undefined);
  });

  it('should return a value from <link rel="icon">', () => {
    const $1 = cheerio.load(`
      <head>
        <link rel="icon" href="res/icon.png">
      </head>
    `);
    expect(
      extractFaviconUrl($1, new URL('http://favicon.example/app/'))?.toString(),
    ).toBe('http://favicon.example/app/res/icon.png');

    const $2 = cheerio.load(`
      <head>
        <link rel="icon" href="res/icon.png">
      </head>
    `);
    expect(
      extractFaviconUrl($2, new URL('http://favicon.example/app'))?.toString(),
    ).toBe('http://favicon.example/res/icon.png');

    const $3 = cheerio.load(`
      <head>
        <link rel="icon" href="/res/icon.png">
      </head>
    `);
    expect(
      extractFaviconUrl($3, new URL('http://favicon.example/app/'))?.toString(),
    ).toBe('http://favicon.example/res/icon.png');

    const $4 = cheerio.load(`
      <head>
        <link rel="icon" href="http://static.example/i">
      </head>
    `);
    expect(
      extractFaviconUrl($4, new URL('http://favicon.example'))?.toString(),
    ).toBe('http://static.example/i');
  });

  it('should return a value from <link rel="icon"> with <base>', () => {
    const $1 = cheerio.load(`
      <head>
        <base href="/app/user/">
        <link rel="icon" href="../static/icon.ico">
      </head>
    `);
    expect(
      extractFaviconUrl($1, new URL('http://favicon.example'))?.toString(),
    ).toBe('http://favicon.example/app/static/icon.ico');

    const $2 = cheerio.load(`
      <head>
        <base href="/app">
        <link rel="icon" href="http://static.example/i">
      </head>
    `);
    expect(
      extractFaviconUrl($2, new URL('http://favicon.example'))?.toString(),
    ).toBe('http://static.example/i');
  });

  it('should return a value from <link rel="shortcut icon">', () => {
    const $ = cheerio.load(`
      <head>
        <link rel="shortcut icon" href="res/icon.png">
      </head>
    `);
    expect(
      extractFaviconUrl($, new URL('http://favicon.example'))?.toString(),
    ).toBe('http://favicon.example/res/icon.png');
  });
});

describe('extractBaseUrl()', () => {
  it('should return the page URL when no base URL is provided', () => {
    const $ = cheerio.load('<head></head>');
    expect(extractBaseUrl($, new URL('http://base.example'))?.toString()).toBe(
      'http://base.example/',
    );
  });

  it('should return the page URL when an invalid URL is provided', () => {
    const $ = cheerio.load('<head><base href="///"></head>');
    expect(extractBaseUrl($, new URL('https://base.example'))?.toString()).toBe(
      'https://base.example/',
    );
  });

  it('should return a value from <base>', () => {
    const $1 = cheerio.load(`
      <head>
        <base href="res/">
      </head>
    `);
    expect(
      extractBaseUrl($1, new URL('http://base.example/app/'))?.toString(),
    ).toBe('http://base.example/app/res/');

    const $2 = cheerio.load(`
      <head>
        <base href="res/">
      </head>
    `);
    expect(
      extractBaseUrl($2, new URL('http://base.example/app'))?.toString(),
    ).toBe('http://base.example/res/');

    const $3 = cheerio.load(`
      <head>
        <base href="/res/">
      </head>
    `);
    expect(
      extractBaseUrl($3, new URL('http://base.example/app/'))?.toString(),
    ).toBe('http://base.example/res/');

    const $4 = cheerio.load(`
      <head>
        <base href="/res">
      </head>
    `);
    expect(
      extractBaseUrl($4, new URL('http://base.example/app/'))?.toString(),
    ).toBe('http://base.example/res');

    const $5 = cheerio.load(`
      <head>
        <base href="http://static.example/i/">
      </head>
    `);
    expect(extractBaseUrl($5, new URL('http://base.example'))?.toString()).toBe(
      'http://static.example/i/',
    );
  });
});
