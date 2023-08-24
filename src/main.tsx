import React from 'react'
import ReactDOM from 'react-dom/client'
import { SourceMapConsumer } from 'source-map'

import App from './App.tsx'
import './index.css'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
