/* v8 ignore start */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SourceMapConsumer } from 'source-map'

import App from './app.tsx'
import './index.css'

// @ts-expect-error -- initialize is typed on the instance interface, not the constructor, in source-map@0.7.x types
SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.6/lib/mappings.wasm',
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
