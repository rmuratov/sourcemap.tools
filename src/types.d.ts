import * as sourceMap from 'source-map'

declare global {
  interface Window {
    sourceMap: typeof sourceMap
  }
}
