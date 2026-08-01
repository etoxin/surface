# File Converter Decisions

## Exact Byte Conversion

`convertFile` accepts a file name and `Uint8Array`, returns a new `Uint8Array`, and has
no I/O or package dependencies. It reads each input byte once. Only ASCII uppercase and
lowercase byte ranges are changed with the specified ROT13 arithmetic; all other byte
values are copied unchanged. The original array is never mutated.

An empty file name and an input above 1,048,576 bytes return null. Exactly 1,048,576
bytes is accepted. A monotonic clock starts when the function is called and is checked
throughout the pass and at completion. Expiration at 5,000 milliseconds, an invalid
initial clock value, or any conversion failure returns null without an output.

Successful output always appends `.rot13` to the original name and uses
`application/octet-stream`. The browser creates the download directly from the returned
bytes, name, and media type.

## Local Browser Interface

The file input accepts one file because it does not use `multiple`. Selection only
displays the browser-provided name and size metadata; `arrayBuffer()` is not called
until Convert is activated. There are no upload, fetch, WebSocket, form-navigation,
third-party package, or subprocess paths. A restrictive content security policy also
disables connections.

While reading and converting, the file input and Convert button are disabled. The live
status reports progress, failure, and success. Failure clears any earlier object URL and
exposes no download. Success exposes exactly one link whose download name and Blob media
type come from `convertedFile`; its Blob is built directly from the returned bytes.

## Packaging and Serving

The Deno server imports the same TypeScript conversion function exercised by the tests
and embeds its runtime source at the marked location in the HTML template. Consequently
the browser receives a single self-contained HTML document and does not request
application modules. The exported request handler serves only `GET /`, and the
executable server listens on port 8005.

## Acceptance Scenarios

1. Opening `/` shows one labelled file picker, a disabled Convert action, a live status,
   and no download.
2. Selecting a file updates only its displayed metadata and does not read it.
3. Activating Convert reads the selected file once and invokes `convertFile` once with
   its original name and exact bytes.
4. Uppercase and lowercase ASCII letters receive byte-level ROT13 while every other byte
   is preserved.
5. An empty name, input above 1 MiB, expired deadline, read error, or conversion error
   displays failure and leaves no download.
6. Success provides one download named `<original name>.rot13` with media type
   `application/octet-stream` and exactly the returned bytes.
