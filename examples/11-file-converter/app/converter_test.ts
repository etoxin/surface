import { convertFile } from "./converter.ts";

const steadyClock = () => 0;

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertBytesEqual(actual: Uint8Array, expected: Uint8Array): void {
  assert(actual.byteLength === expected.byteLength, "Byte lengths differ");
  for (let index = 0; index < actual.byteLength; index += 1) {
    assert(actual[index] === expected[index], `Bytes differ at index ${index}`);
  }
}

Deno.test("convertFile rotates uppercase ASCII letters", () => {
  const result = convertFile(
    {
      fileName: "upper.bin",
      bytes: new TextEncoder().encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    },
    steadyClock,
  );

  assert(result !== null);
  assert(
    new TextDecoder().decode(result.bytes) ===
      "NOPQRSTUVWXYZABCDEFGHIJKLM",
  );
});

Deno.test("convertFile rotates lowercase ASCII letters", () => {
  const result = convertFile(
    {
      fileName: "lower.bin",
      bytes: new TextEncoder().encode("abcdefghijklmnopqrstuvwxyz"),
    },
    steadyClock,
  );

  assert(result !== null);
  assert(
    new TextDecoder().decode(result.bytes) ===
      "nopqrstuvwxyzabcdefghijklm",
  );
});

Deno.test("convertFile leaves nonletters unchanged", () => {
  const bytes = Uint8Array.from([0x00, 0x40, 0x5b, 0x60, 0x7b, 0x80, 0xff]);
  const result = convertFile({ fileName: "data", bytes }, steadyClock);

  assert(result !== null);
  assertBytesEqual(result.bytes, bytes);
});

Deno.test("convertFile preserves every byte outside ASCII letters", () => {
  const input = Uint8Array.from({ length: 256 }, (_, byte) => byte);
  const original = input.slice();
  const result = convertFile({ fileName: "all-bytes.dat", bytes: input }, steadyClock);

  assert(result !== null);
  assert(result.fileName === "all-bytes.dat.rot13");
  assert(result.mediaType === "application/octet-stream");
  assert(result.bytes.buffer !== input.buffer);
  assertBytesEqual(input, original);

  for (let byte = 0; byte < 256; byte += 1) {
    const isAsciiLetter = (byte >= 0x41 && byte <= 0x5a) ||
      (byte >= 0x61 && byte <= 0x7a);
    if (!isAsciiLetter) {
      assert(result.bytes[byte] === byte);
    }
  }
});

Deno.test("convertFile rejects an empty name and files over 1 MiB", () => {
  assert(
    convertFile({ fileName: "", bytes: new Uint8Array() }, steadyClock) ===
      null,
  );
  assert(
    convertFile(
      { fileName: "too-large.bin", bytes: new Uint8Array(1_048_577) },
      steadyClock,
    ) === null,
  );

  const exactLimit = convertFile(
    { fileName: "limit.bin", bytes: new Uint8Array(1_048_576) },
    steadyClock,
  );
  assert(exactLimit !== null);
  assert(exactLimit.bytes.byteLength === 1_048_576);
});

Deno.test("convertFile returns null when its deadline expires or a step fails", () => {
  let clockCall = 0;
  const expiringClock = () => clockCall++ === 0 ? 10 : 5_010;
  assert(
    convertFile(
      { fileName: "late.bin", bytes: Uint8Array.of(0x41) },
      expiringClock,
    ) === null,
  );

  assert(
    convertFile(
      { fileName: "error.bin", bytes: Uint8Array.of(0x41) },
      () => {
        throw new Error("clock failed");
      },
    ) === null,
  );
});
