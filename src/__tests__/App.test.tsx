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
  test('parses stack trace and shows file names', async () => {
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

  test('shows warning if parsing failed', async () => {
    render(<App />)
    const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')

    expect(screen.queryByTestId('filenames-list')).not.toBeInTheDocument()

    stacktraceTextarea.focus()
    await userEvent.paste('lorem ipsum')
    expect(stacktraceTextarea).toHaveValue('lorem ipsum')

    const label = screen.queryByTestId('stacktrace-textarea-label')
    await waitFor(() =>
      expect(label).toHaveTextContent('It seems that the text you pasted is not a stack trace'),
    )
    await waitFor(() => expect(label).toHaveClass('text-warning'))
  })

  test('clears the result after deleting stack trace', async () => {
    render(<App />)

    const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
    const resultTextArea = screen.getByTestId('result-textarea')

    stacktraceTextarea.focus()
    await userEvent.paste(regular.stacktrace)

    const sourceMapFileInput = screen.getByTestId('sourcemap-file-input')
    const file = new File([regular.sourcemaps[0].content], regular.sourcemaps[0].fileName)
    await userEvent.upload(sourceMapFileInput, file)

    await waitFor(() => expect(resultTextArea).toHaveValue())

    await userEvent.clear(stacktraceTextarea)

    await waitFor(() => expect(resultTextArea).toHaveValue(''))
  })
})

describe('source maps', () => {
  test('allows selecting multiple source map files', async () => {
    render(<App />)
    const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
    const resultTextArea = screen.getByTestId('result-textarea')

    stacktraceTextarea.focus()
    await userEvent.paste(regular.stacktrace)
    expect(resultTextArea).toHaveValue('')

    const sourceMapFileInput = screen.getByTestId('sourcemap-file-input')
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await userEvent.upload(sourceMapFileInput, files)
    await waitFor(() => expect(resultTextArea).toHaveValue(regular.result))
  })

  test('allows pasting source map contents', async () => {
    render(<App />)

    const sourcemapTextarea = screen.getByTestId('sourcemap-textarea')
    sourcemapTextarea.focus()
    await userEvent.paste(regular.sourcemaps[0].content)

    const sourcemapList = screen.getByTestId('sourcemaps-list')
    expect(sourcemapList).toBeInTheDocument()
    expect(within(sourcemapList).getByText('index-d803759c.js')).toBeInTheDocument()
  })

  test('updates related lines in the result after deleting sourcemap', async () => {
    render(<App />)

    const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
    const resultTextArea = screen.getByTestId('result-textarea')

    stacktraceTextarea.focus()
    await userEvent.paste(regular.stacktrace)

    const sourceMapFileInput = screen.getByTestId('sourcemap-file-input')
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await userEvent.upload(sourceMapFileInput, files)

    await userEvent.click(screen.getAllByText('delete')[0])

    await waitFor(() => expect(resultTextArea).toHaveValue(regular.afterDeleteIndex))
  })

  test('shows empty result after deleting all sourcemaps', async () => {
    render(<App />)

    const stacktraceTextarea = screen.getByTestId('stacktrace-textarea')
    const resultTextArea = screen.getByTestId('result-textarea')

    stacktraceTextarea.focus()
    await userEvent.paste(regular.stacktrace)

    const sourceMapFileInput = screen.getByTestId('sourcemap-file-input')
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await userEvent.upload(sourceMapFileInput, files)

    await Promise.all(screen.getAllByText('delete').map(btn => userEvent.click(btn)))

    await waitFor(() => expect(resultTextArea).toHaveValue(''))
  })
})
