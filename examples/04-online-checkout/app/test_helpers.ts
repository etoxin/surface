export function equal(actual: unknown, expected: unknown): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `Expected ${Deno.inspect(expected)}, received ${Deno.inspect(actual)}`,
    );
  }
}

export function deepStrictEqual(actual: unknown, expected: unknown): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(
      `Expected ${Deno.inspect(expected)}, received ${Deno.inspect(actual)}`,
    );
  }
}

export function ok(value: unknown): asserts value {
  if (!value) {
    throw new Error(`Expected a truthy value, received ${Deno.inspect(value)}`);
  }
}
