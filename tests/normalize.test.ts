import { describe, expect, it } from 'vitest';
import { normalize } from '../src/core/normalize';
import vectors from './normalize.vectors.json';

// Mismos vectores que scripts/test_normalize.py: garantizan que Python (build) y TS (app) coinciden.
describe('normalize', () => {
  it.each(vectors as [string, string][])('%j → %j', (raw, expected) => {
    expect(normalize(raw)).toBe(expected);
  });

  it('es idempotente', () => {
    for (const [, expected] of vectors as [string, string][]) {
      expect(normalize(expected)).toBe(expected);
    }
  });
});
