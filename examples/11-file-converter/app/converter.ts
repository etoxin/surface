export interface FileConversionInput {
  fileName: string;
  bytes: Uint8Array;
}

export interface ConvertedFile {
  fileName: string;
  mediaType: "application/octet-stream";
  bytes: Uint8Array;
}

export function convertFile(
  input: FileConversionInput,
  monotonicNow: () => number = () => performance.now(),
): ConvertedFile | null {
  try {
    const startedAt = monotonicNow();
    if (!Number.isFinite(startedAt)) {
      return null;
    }

    const byteLength = input.bytes.byteLength;
    if (input.fileName.length === 0 || byteLength > 1_048_576) {
      return null;
    }

    const convertedBytes = new Uint8Array(byteLength);
    for (let index = 0; index < byteLength; index += 1) {
      if (monotonicNow() - startedAt >= 5_000) {
        return null;
      }

      const byte = input.bytes[index];
      if (byte >= 0x41 && byte <= 0x5a) {
        convertedBytes[index] = 0x41 + ((byte - 0x41 + 13) % 26);
      } else if (byte >= 0x61 && byte <= 0x7a) {
        convertedBytes[index] = 0x61 + ((byte - 0x61 + 13) % 26);
      } else {
        convertedBytes[index] = byte;
      }
    }

    if (monotonicNow() - startedAt >= 5_000) {
      return null;
    }

    return {
      fileName: `${input.fileName}.rot13`,
      mediaType: "application/octet-stream",
      bytes: convertedBytes,
    };
  } catch {
    return null;
  }
}
