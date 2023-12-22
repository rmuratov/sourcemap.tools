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
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)
    expect(stacktraceTextarea).toHaveValue(regular.stacktrace)

    const filenamesList = screen.getByRole('list', { name: /file names/i })
    expect(filenamesList).toBeInTheDocument()

    const filenamesListItems = within(filenamesList).getAllByRole('listitem')
    const fileNames = filenamesListItems.map(item => item.textContent)

    expect(fileNames).toEqual(['index-d803759c.js', 'vendor-221d27ba.js'])
  })

  test('shows warning if parsing failed', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })

    await user.type(stacktraceTextarea, 'lorem ipsum')
    expect(stacktraceTextarea).toHaveValue('lorem ipsum')

    const label = screen.getByText(/text you pasted is not a stack trace/i)
    expect(label).toHaveClass('text-warning')
  })

  test('clears the result after deleting stack trace', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const file = new File([regular.sourcemaps[0].content], regular.sourcemaps[0].fileName)
    await user.upload(sourceMapFileInput, file)

    await waitFor(() => expect(resultTextArea).toHaveValue())

    await user.clear(stacktraceTextarea)

    await waitFor(() => expect(resultTextArea).toHaveValue(''))
  })
})

describe('source maps', () => {
  test('allows selecting multiple source map files', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)
    expect(resultTextArea).toHaveValue('')

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await user.upload(sourceMapFileInput, files)

    await waitFor(() => expect(resultTextArea).toHaveValue(regular.result))
  })

  test('allows providing source map contents through text input', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    // TODO: Replace with userEvent.type? But need to escape spec. chars.
    sourcemapTextarea.focus()
    await user.paste(regular.sourcemaps[0].content)

    const sourcemapList = screen.getByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapList).toBeInTheDocument()

    expect(within(sourcemapList).getByRole('listitem')).toHaveTextContent('index-d803759c.js')
  })

  test('updates related lines in the result after deleting sourcemap', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await user.upload(sourceMapFileInput, files)

    const deleteButtons = await screen.findAllByRole('button', { name: 'delete' })
    await user.click(deleteButtons[0])
    await waitFor(() => expect(resultTextArea).toHaveValue(regular.afterDeleteIndex))
  })

  test('shows empty result after deleting all sourcemaps', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await userEvent.upload(sourceMapFileInput, files)

    const deleteButtons = await screen.findAllByRole('button', { name: 'delete' })
    await Promise.all(deleteButtons.map(btn => userEvent.click(btn)))

    await waitFor(() => expect(resultTextArea).toHaveValue(''))
  })
})
