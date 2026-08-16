/* v8 ignore start */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SourceMapConsumer } from 'source-map'
import mappingsWasmUrl from 'source-map/lib/mappings.wasm?url'

import App from './app.tsx'
import './index.css'

// @ts-expect-error -- initialize is typed on the instance interface, not the constructor, in source-map@0.7.x types
SourceMapConsumer.initialize({
  'lib/mappings.wasm': mappingsWasmUrl,
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

// The app itself only emits neutral app events; forwarding them anywhere is
// opt-in and lives entirely in the adapter loaded here.
if (import.meta.env.VITE_ANALYTICS === 'simple-analytics') {
  void import('./analytics/simple-analytics.ts').then(({ initSimpleAnalytics }) => {
    initSimpleAnalytics()
  })
}
/* v8 ignore end */
