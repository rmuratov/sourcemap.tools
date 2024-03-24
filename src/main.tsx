/* v8 ignore start */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SourceMapConsumer } from 'source-map'

import App from './App.tsx'
import './index.css'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
})

const container = document.getElementById('root')

if (!container) {
  throw new Error('No container')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
/* v8 ignore end */
