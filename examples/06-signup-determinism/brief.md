# Generation Brief

Use `surface.kdl` and the frozen Surface 0.1 skill to build the application in one empty
build directory.

Requirements for the benchmark adapter:

- use Deno TypeScript for the server and one HTML document for the browser;
- export `createApp(): (request: Request) => Promise<Response>` from `server.ts`;
- serve the application at `GET /`;
- implement registration at `POST /register` with a JSON body matching the `signupInput`
  collection;
- keep state in memory and start no listener when the module is imported;
- when executed directly, listen on the port assigned to that build;
- use Pico CSS 2 as specified;
- add no dependencies or behavior not required by `surface.kdl`.

Do not inspect another build. The shared acceptance suite, not its source code, defines
the benchmark boundary.
