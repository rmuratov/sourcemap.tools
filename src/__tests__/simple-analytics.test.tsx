import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { initSimpleAnalytics } from '../analytics/simple-analytics.ts'
import App from '../app.tsx'
import { regular } from './fixtures'

const subscriptions: (() => void)[] = []

// Runs even when an assertion fails, so a leaked subscription from one test
// cannot reappear as a failure in the next one. Only sa_event is reset here:
// unstubbing every global would also drop the matchMedia stub the shared setup
// installs.
afterEach(() => {
  subscriptions.splice(0).forEach(unsubscribe => unsubscribe())
  vi.stubGlobal('sa_event', undefined)
})

function startForwarding() {
  const unsubscribe = initSimpleAnalytics()
  subscriptions.push(unsubscribe)
  return unsubscribe
}

describe('simple analytics', () => {
  test('reports app events to sa_event', async () => {
    const saEvent = vi.fn<(name: string) => void>()
    vi.stubGlobal('sa_event', saEvent)

    startForwarding()

    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)
    expect(saEvent).toHaveBeenCalledWith('stacktrace_pasted')

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await user.upload(sourceMapFileInput, files)

    await waitFor(() => expect(resultTextArea).toHaveValue(regular.result))

    expect(saEvent.mock.calls.map(([name]) => name)).toEqual([
      'stacktrace_pasted',
      'sourcemap_added_file',
      'stacktrace_transformed',
    ])
  })

  test('stops reporting after the subscription is removed', async () => {
    const saEvent = vi.fn<(name: string) => void>()
    vi.stubGlobal('sa_event', saEvent)

    const stop = startForwarding()
    stop()

    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    await user.type(stacktraceTextarea, regular.stacktrace)

    expect(saEvent).not.toHaveBeenCalled()
  })

  test('does nothing when the Simple Analytics script is unavailable', async () => {
    startForwarding()

    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })

    // A blocked or not yet loaded script leaves sa_event undefined, which must
    // not break the app.
    await expect(user.type(stacktraceTextarea, regular.stacktrace)).resolves.toBeUndefined()
  })
})
