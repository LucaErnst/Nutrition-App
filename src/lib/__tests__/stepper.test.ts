import { describe, expect, it } from 'vitest';
import { stepFor } from '../../components/AmountStepper';

describe('stepFor', () => {
  it('1 Stück, 10 g ab 20 g, darunter 5 g', () => {
    expect(stepFor('Stück', 3)).toBe(1);
    expect(stepFor('g', 100)).toBe(10);
    expect(stepFor('g', 20)).toBe(10);
    expect(stepFor('g', 15)).toBe(5);
    expect(stepFor('ml', 250)).toBe(10);
  });
});
