// A neutral bus of domain facts about how the app is used. It carries names
// only, never stack trace or source map contents. Nothing subscribes to it by
// default: listeners are attached from the outside, so the app itself stays
// free of any particular analytics vendor.
export type AppEvent =
  | 'sourcemap_added_file'
  | 'sourcemap_added_text'
  | 'sourcemap_parse_error'
  | 'stacktrace_parse_error'
  | 'stacktrace_pasted'
  | 'stacktrace_transformed'

type AppEventListener = (event: AppEvent) => void

const listeners = new Set<AppEventListener>()

export function emitAppEvent(event: AppEvent) {
  for (const listener of listeners) {
    listener(event)
  }
}

// Returns a function that removes the listener again.
export function onAppEvent(listener: AppEventListener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
