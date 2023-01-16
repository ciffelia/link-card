import { describe, expect, it } from 'vitest';
import { fallback } from '../fallback';

describe('fallback()', () => {
  it('should return undefined when every value is empty', () => {
    expect(fallback()).toBe(undefined);
    expect(fallback(undefined)).toBe(undefined);
    expect(fallback('')).toBe(undefined);
    expect(fallback('', '')).toBe(undefined);
    expect(fallback(undefined, undefined)).toBe(undefined);
    expect(fallback(undefined, '')).toBe(undefined);
  });

  it('should return some value', () => {
    expect(fallback('a', 'b', 'c')).toBe('a');
    expect(fallback('a', '', 'c')).toBe('a');
    expect(fallback('a', undefined, 'c')).toBe('a');

    expect(fallback('', 'b', 'c')).toBe('b');
    expect(fallback(undefined, 'b', 'c')).toBe('b');
    expect(fallback(undefined, 'b', '')).toBe('b');

    expect(fallback('', '', 'c')).toBe('c');
    expect(fallback('', undefined, 'c')).toBe('c');
  });
});
