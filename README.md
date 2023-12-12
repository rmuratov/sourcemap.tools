# sourcemap.tools

![image](public/app-demo.jpeg)

This repo is the source code for the https://sourcemap.tools.

This little web app allows you to paste a stack trace of minified JavaScript code, apply source maps to it and see the original positions of the errors.

The application may be useful for investigating errors in production if you do not host source maps, but still can extract them from build artifacts.

Inspired by https://sourcemaps.info/, but does everything on the client and does not try to fetch sources or sourcemaps.

## How to use

1. Paste your stack trace on the left.
2. Provide source maps either by choosing files or pasting the content of the source map.
3. See results on the right.

## Development

1. Clone repo
2. Go to the project directory and install deps

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
