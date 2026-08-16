/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Selects the analytics vendor to load, if any. Set it on the deployment that
  // owns the analytics account; builds without it ship no analytics. Kept a
  // plain string so a fork can gate its own vendor on another value.
  readonly VITE_ANALYTICS?: string
}

declare module '*.wasm?url' {
  const url: string
  export default url
}
