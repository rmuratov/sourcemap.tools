import { RawIndexMap, RawSourceMap, SourceMapConsumer } from 'source-map'

import { transform } from './smtool.ts'
import { throwError } from './utils.ts'

SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
})

const stackTrace = `Uncaught Error: Error!
    at u (index-d803759c.js:1:785)
    at i (index-d803759c.js:1:831)
    at Object.Dc (vendor-221d27ba.js:37:9852)
    at Fc (vendor-221d27ba.js:37:10006)
    at jc (vendor-221d27ba.js:37:10063)
    at ii (vendor-221d27ba.js:37:31442)
    at Xs (vendor-221d27ba.js:37:31859)
    at vendor-221d27ba.js:37:36771
    at Co (vendor-221d27ba.js:40:36724)
    at gs (vendor-221d27ba.js:37:8988)
`

const maps: Record<string, RawIndexMap | RawSourceMap | string> = {
  'index-d803759c.js': {
    file: 'index-d803759c.js',
    mappings:
      '6vBAAO,SAASA,GAAa,CACrB,MAAA,IAAI,MAAM,QAAQ,CAC1B,CCAA,SAASC,GAAM,CACb,SAASC,GAAc,CACVF,GACb,CAEA,cACG,MACC,CAAA,SAAA,CAAAG,EAAA,IAAC,WAAS,CAAA,UAAU,6BAA6B,YAAY,MAAM,EAElEA,EAAA,IAAA,SAAA,CAAO,QAASD,EAAa,SAAc,iBAAA,CAC9C,CAAA,CAAA,CAEJ,CCRAE,EAAS,WAAW,SAAS,eAAe,MAAM,CAAE,EAAE,aACjDC,EAAM,WAAN,CACG,SAAAF,EAAAA,IAACF,GAAI,CAAA,EACT,CACJ',
    names: ['throwError', 'App', 'handleClick', 'jsx', 'ReactDOM', 'React'],
    sources: ['../../src/utils.ts', '../../src/App.tsx', '../../src/main.tsx'],
    sourcesContent: [
      "export function throwError() {\n  throw new Error('Error!')\n}\n",
      'import { throwError } from \'./utils.ts\'\n\nfunction App() {\n  function handleClick() {\n    throwError()\n  }\n\n  return (\n    <div>\n      <textarea className="textarea textarea-bordered" placeholder="Bio"></textarea>\n\n      <button onClick={handleClick}>Generate error</button>\n    </div>\n  )\n}\n\nexport default App\n',
      "import React from 'react'\nimport ReactDOM from 'react-dom/client'\n\nimport App from './App.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n    <React.StrictMode>\n        <App />\n    </React.StrictMode>,\n)\n",
    ],
    version: 3,
  },
}

function App() {
  function handleClick() {
    throwError()
  }

  transform(stackTrace, maps).then(r => {
    console.log('RESULT', r)
  })

  return (
    <div className="container">
      <div className="navbar bg-base-100">
        <a className="btn btn-ghost normal-case text-xl">smtool</a>
      </div>

      <textarea className="textarea textarea-bordered" placeholder="Bio"></textarea>

      <div>
        <button className="btn btn-primary" onClick={handleClick}>
          Generate error
        </button>
      </div>
    </div>
  )
}

export default App
