import { onAppEvent } from '../app-events.ts'

declare global {
  interface Window {
    // Defined by the Simple Analytics queue stub, which the Vite plugin only
    // injects when analytics are enabled for the build.
    sa_event?: (name: string) => void
  }
}

// Forwards the app event names, and nothing else, to Simple Analytics.
// Returns a function that stops the forwarding again.
export function initSimpleAnalytics() {
  return onAppEvent(event => {
    window.sa_event?.(event)
  })
}
