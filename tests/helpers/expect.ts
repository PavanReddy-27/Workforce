import assert from 'node:assert/strict';

export interface AssertionMethods {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toStrictEqual(expected: unknown): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, precision?: number): void;
  toContain(expected: unknown): void;
  toHaveProperty(prop: string): void;
  toThrow(regexOrMessage?: RegExp | string): void;
  not: AssertionMethods;
}

export function expect(actual: unknown): AssertionMethods {
  const createAssertion = (isNot = false): AssertionMethods => ({
    toBe(expected: unknown) {
      if (isNot) {
        assert.notStrictEqual(actual, expected);
      } else {
        assert.strictEqual(actual, expected);
      }
    },
    toEqual(expected: unknown) {
      if (isNot) {
        assert.notDeepStrictEqual(actual, expected);
      } else {
        assert.deepStrictEqual(actual, expected);
      }
    },
    toStrictEqual(expected: unknown) {
      if (isNot) {
        assert.notDeepStrictEqual(actual, expected);
      } else {
        assert.deepStrictEqual(actual, expected);
      }
    },
    toBeDefined() {
      if (isNot) {
        assert.strictEqual(actual, undefined);
      } else {
        assert.notStrictEqual(actual, undefined);
      }
    },
    toBeUndefined() {
      if (isNot) {
        assert.notStrictEqual(actual, undefined);
      } else {
        assert.strictEqual(actual, undefined);
      }
    },
    toBeNull() {
      if (isNot) {
        assert.notStrictEqual(actual, null);
      } else {
        assert.strictEqual(actual, null);
      }
    },
    toBeTruthy() {
      if (isNot) {
        assert.ok(!actual);
      } else {
        assert.ok(actual);
      }
    },
    toBeFalsy() {
      if (isNot) {
        assert.ok(actual);
      } else {
        assert.ok(!actual);
      }
    },
    toBeGreaterThan(expected: number) {
      if (isNot) {
        assert.ok((actual as number) <= expected);
      } else {
        assert.ok((actual as number) > expected);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (isNot) {
        assert.ok((actual as number) < expected);
      } else {
        assert.ok((actual as number) >= expected);
      }
    },
    toBeLessThan(expected: number) {
      if (isNot) {
        assert.ok((actual as number) >= expected);
      } else {
        assert.ok((actual as number) < expected);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (isNot) {
        assert.ok((actual as number) > expected);
      } else {
        assert.ok((actual as number) <= expected);
      }
    },
    toBeCloseTo(expected: number, precision = 2) {
      const diff = Math.abs((actual as number) - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      if (isNot) {
        assert.ok(diff > tolerance);
      } else {
        assert.ok(diff <= tolerance);
      }
    },
    toContain(expected: unknown) {
      if (Array.isArray(actual)) {
        if (isNot) {
          assert.ok(!actual.includes(expected));
        } else {
          assert.ok(actual.includes(expected));
        }
      } else if (typeof actual === 'string') {
        if (isNot) {
          assert.ok(!actual.includes(String(expected)));
        } else {
          assert.ok(actual.includes(String(expected)));
        }
      } else {
        throw new Error('toContain can only be used with arrays or strings');
      }
    },
    toHaveProperty(prop: string) {
      const has = actual !== null && typeof actual === 'object' && prop in (actual as object);
      if (isNot) {
        assert.ok(!has);
      } else {
        assert.ok(has);
      }
    },
    toThrow(regexOrMessage?: RegExp | string) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow expects a function');
      }
      let threw = false;
      let caughtError: unknown;
      try {
        actual();
      } catch (err) {
        threw = true;
        caughtError = err;
      }

      if (isNot) {
        assert.ok(!threw, 'Expected function not to throw, but it threw');
      } else {
        assert.ok(threw, 'Expected function to throw, but it did not');
        if (regexOrMessage) {
          const msg = (caughtError as Error).message || String(caughtError);
          if (regexOrMessage instanceof RegExp) {
            assert.match(msg, regexOrMessage);
          } else {
            assert.ok(msg.includes(regexOrMessage));
          }
        }
      }
    },
    get not() {
      return createAssertion(true);
    },
  });

  return createAssertion(false);
}
