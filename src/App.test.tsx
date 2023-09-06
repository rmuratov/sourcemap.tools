import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect } from 'vitest'

import { regular } from './__tests__/fixtures'
import App from './App.tsx'

describe('general', () => {
  test('renders', () => {
    render(<App />)
  })
})

describe('stack trace', () => {
  test('parses stack trace', async () => {
    render(<App />)
    const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')

    expect(screen.queryByTestId('filenames-list')).not.toBeInTheDocument()

    stacktraceTextarea.focus()
    await userEvent.paste(regular.stacktrace)
    expect(stacktraceTextarea).toHaveValue(regular.stacktrace)

    const filenamesList = screen.getByTestId('filenames-list')
    expect(filenamesList).toBeInTheDocument()
    expect(screen.getByText('index-d803759c.js')).toBeInTheDocument()
    expect(screen.getByText('vendor-221d27ba.js')).toBeInTheDocument()
  })
})

describe('sourcemaps', () => {
  describe('supports sourcemaps from file input', () => {
    test('multiple sourcemaps at once', async () => {
      render(<App />)
      const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
      const resultTextArea = screen.getByTestId('result-textarea')

      stacktraceTextarea.focus()
      await userEvent.paste(regular.stacktrace)
      expect(resultTextArea).toHaveValue('')

      const sourcemapFileInput = screen.getByTestId('sourcemap-file-input')
      const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
      await userEvent.upload(sourcemapFileInput, files)
      await waitFor(() => expect(resultTextArea).toHaveValue(regular.result))
    })
  })
})
