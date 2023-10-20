import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect } from 'vitest'

import App from '../App.tsx'
import { regular } from './fixtures'

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
    expect(within(filenamesList).getByText('index-d803759c.js')).toBeInTheDocument()
    expect(within(filenamesList).getByText('vendor-221d27ba.js')).toBeInTheDocument()
  })
})

describe('sourcemaps', () => {
  describe('file input', () => {
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

  describe('textarea', () => {
    test('pasting whole sourcemap', async () => {
      render(<App />)

      const sourcemapTextarea = screen.getByTestId('sourcemap-textarea')
      sourcemapTextarea.focus()
      await userEvent.paste(regular.sourcemaps[0].content)

      const sourcemapList = screen.getByTestId('sourcemaps-list')
      expect(sourcemapList).toBeInTheDocument()
      expect(within(sourcemapList).getByText('index-d803759c.js')).toBeInTheDocument()
    })
  })

  describe('deleting', () => {
    test('updates related lines after deleting sourcemap', async () => {
      render(<App />)

      const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
      const resultTextArea = screen.getByTestId('result-textarea')

      stacktraceTextarea.focus()
      await userEvent.paste(regular.stacktrace)

      const sourcemapFileInput = screen.getByTestId('sourcemap-file-input')
      const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
      await userEvent.upload(sourcemapFileInput, files)

      await userEvent.click(screen.getAllByText('delete')[0])

      await waitFor(() => expect(resultTextArea).toHaveValue(regular.afterDeleteIndex))
    })

    test('shows empty result if there are no sourcemaps', async () => {
      render(<App />)

      const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
      const resultTextArea = screen.getByTestId('result-textarea')

      stacktraceTextarea.focus()
      await userEvent.paste(regular.stacktrace)

      const sourcemapFileInput = screen.getByTestId('sourcemap-file-input')
      const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
      await userEvent.upload(sourcemapFileInput, files)

      await Promise.all(screen.getAllByText('delete').map(btn => userEvent.click(btn)))

      await waitFor(() => expect(resultTextArea).toHaveValue(''))
    })
  })
})
