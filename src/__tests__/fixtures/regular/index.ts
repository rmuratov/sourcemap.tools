import fs from 'node:fs'
import path from 'node:path'

export const regular = {
  afterDeleteIndex: `Uncaught Error: Error!
  at e.throwError (index-F7qoIhl0.js:2:1251)
  at onClick (index-F7qoIhl0.js:3:5483)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:12317:12)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:12867:4)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:1498:35)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:12455:2)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:15306:6)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:15274:6)`,
  reconstructed: `Uncaught Error: Error!
  at e.throwError (index-F7qoIhl0.js:2:1251)
  at onClick (index-F7qoIhl0.js:3:5483)
  at yd (vendor-B_FE3Fnm.js:8:125915)
  at (vendor-B_FE3Fnm.js:8:130908)
  at gn (vendor-B_FE3Fnm.js:8:15080)
  at wd (vendor-B_FE3Fnm.js:8:127142)
  at up (vendor-B_FE3Fnm.js:9:28431)
  at cp (vendor-B_FE3Fnm.js:9:28253)`,
  result: `Uncaught Error: Error!
  at (../../src/source-map.ts:60:14)
  at (../../src/app.tsx:164:66)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:12317:12)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:12867:4)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:1498:35)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:12455:2)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:15306:6)
  at (../../node_modules/react-dom/cjs/react-dom-client.production.js:15274:6)`,
  sourcemaps: ['index-F7qoIhl0.js.map', 'vendor-B_FE3Fnm.js.map'].map(fileName => ({
    content: fs.readFileSync(path.resolve(__dirname, 'sourcemaps', fileName)).toString(),
    fileName,
  })),
  stacktrace: `Uncaught Error: Error!
  at e.throwError (index-F7qoIhl0.js:2:1251)
  at onClick (index-F7qoIhl0.js:3:5483)
  at yd (vendor-B_FE3Fnm.js:8:125915)
  at vendor-B_FE3Fnm.js:8:130908
  at gn (vendor-B_FE3Fnm.js:8:15080)
  at wd (vendor-B_FE3Fnm.js:8:127142)
  at up (vendor-B_FE3Fnm.js:9:28431)
  at cp (vendor-B_FE3Fnm.js:9:28253)`,
}
