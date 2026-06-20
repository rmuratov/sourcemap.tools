# sourcemap.tools

![example workflow](https://github.com/rmuratov/sourcemap.tools/actions/workflows/node.js.yml/badge.svg)
[![codecov](https://codecov.io/github/rmuratov/sourcemap.tools/graph/badge.svg?token=S2D14Y7JTN)](https://codecov.io/github/rmuratov/sourcemap.tools)

![image](public/app-demo.jpeg)

This repo contains the source code for the https://sourcemap.tools.

This little web app allows you to paste a stack trace of minified JavaScript code, apply source maps to it, and see the original positions of the errors.

The application may help investigate errors in production if you do not host source maps but can still extract them from build artifacts.

Inspired by https://sourcemaps.info/, but does everything on the client and does not try to fetch sources or source maps.

## How to use

1. Paste your stack trace on the left.
2. Provide source maps by choosing files or pasting the content of the source map.
3. See the results on the right.

## Known issues

**Indexed (sectioned) source maps are not supported.** Some tools (e.g. webpack with `source-map-loader`) produce source maps with a `sections` field instead of `mappings`. These will be rejected silently.

If you have a real-world case where this matters, please [open an issue](https://github.com/rmuratov/sourcemap.tools/issues) and attach the source map file and a sample stack trace — that will make it straightforward to add test coverage and implement support.

## Development

1. Clone the repository
2. Go to the project's directory and install dependencies

   ```shell
   npm ci
   ```

3. Run and go to http://localhost:5173/

   ```shell
   npm run dev
   ```

4. Optionally run tests

   ```shell
   npm test
   ```
