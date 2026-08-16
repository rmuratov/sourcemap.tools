/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Selects the analytics vendor to load, if any. Set it on the deployment
  // that owns the analytics account; builds without it ship no analytics.
  readonly VITE_ANALYTICS?: 'simple-analytics'
}

declare module '*.wasm?url' {
  const url: string
  export default url
}
