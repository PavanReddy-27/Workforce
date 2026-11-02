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
        assert.ok(Boolean(actual));
      }
    },
    toBeFalsy() {
      if (isNot) {
        assert.ok(Boolean(actual));
      } else {
        assert.ok(!actual);
      }
    },
    toBeGreaterThan(expected: number) {
      const val = Number(actual);
      if (isNot) {
        assert.ok(val <= expected, `Expected ${val} not to be greater than ${expected}`);
      } else {
        assert.ok(val > expected, `Expected ${val} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const val = Number(actual);
      if (isNot) {
        assert.ok(val < expected, `Expected ${val} not to be >= ${expected}`);
      } else {
        assert.ok(val >= expected, `Expected ${val} to be >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      const val = Number(actual);
      if (isNot) {
        assert.ok(val >= expected, `Expected ${val} not to be less than ${expected}`);
      } else {
        assert.ok(val < expected, `Expected ${val} to be less than ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const val = Number(actual);
      if (isNot) {
        assert.ok(val > expected, `Expected ${val} not to be <= ${expected}`);
      } else {
        assert.ok(val <= expected, `Expected ${val} to be <= ${expected}`);
      }
    },
    toBeCloseTo(expected: number, precision = 2) {
      const diff = Math.abs(Number(actual) - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      if (isNot) {
        assert.ok(diff >= tolerance);
      } else {
        assert.ok(diff < tolerance, `Expected ${actual} to be close to ${expected}`);
      }
    },
    toContain(expected: unknown) {
      if (Array.isArray(actual)) {
        const found = actual.includes(expected);
        if (isNot) {
          assert.ok(!found, `Expected array not to contain ${expected}`);
        } else {
          assert.ok(found, `Expected array to contain ${expected}`);
        }
      } else if (typeof actual === 'string') {
        const found = actual.includes(String(expected));
        if (isNot) {
          assert.ok(!found, `Expected string not to contain ${expected}`);
        } else {
          assert.ok(found, `Expected string to contain ${expected}`);
        }
      } else {
        throw new Error('toContain can only be used with arrays or strings');
      }
    },
    toHaveProperty(prop: string) {
      const obj = actual as Record<string, unknown>;
      const has = obj !== null && typeof obj === 'object' && prop in obj;
      if (isNot) {
        assert.ok(!has, `Expected object not to have property ${prop}`);
      } else {
        assert.ok(has, `Expected object to have property ${prop}`);
      }
    },
    toThrow(regexOrMessage?: RegExp | string) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow requires a function to be passed to expect()');
      }
      if (isNot) {
        assert.doesNotThrow(actual as () => void);
      } else {
        if (regexOrMessage instanceof RegExp) {
          assert.throws(actual as () => void, regexOrMessage);
        } else if (typeof regexOrMessage === 'string') {
          assert.throws(actual as () => void, new RegExp(regexOrMessage));
        } else {
          assert.throws(actual as () => void);
        }
      }
    },
    get not() {
      return createAssertion(true);
    },
  });

  return createAssertion(false);
}
