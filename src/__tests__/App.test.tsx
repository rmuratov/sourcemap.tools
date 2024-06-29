import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import App from '../App.tsx'
import { regular } from './fixtures'
import { mockPrefersColorScheme } from './setup.ts'

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
    await user.upload(sourceMapFileInput, files)

    const deleteButtons = await screen.findAllByRole('button', { name: 'delete' })
    await Promise.all(deleteButtons.map(btn => user.click(btn)))

    await waitFor(() => expect(resultTextArea).toHaveValue(''))
  })

  test('ignores empty files list', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    await user.upload(sourceMapFileInput, [])

    const sourcemapList = screen.queryByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapList).not.toBeInTheDocument()
  })

  test('shows warning if the file is not source map', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const file = new File(['lorem ipsum'], 'lorem_ipsum.txt')
    await user.upload(sourceMapFileInput, file)

    const warning = screen.getByText(/some of the files were not source maps/i)
    expect(warning).toBeInTheDocument()

    const dismissWarningBtn = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissWarningBtn)

    expect(warning).not.toBeInTheDocument()
  })

  test('shows warning if the source map text content is not source map', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    // TODO: Replace with userEvent.type? But need to escape spec. chars.
    sourcemapTextarea.focus()
    await user.paste('lorem ipsum')

    const warning = screen.getByText(/provided text is not a source map/i)
    expect(warning).toBeInTheDocument()

    await user.clear(sourcemapTextarea)
    expect(warning).not.toBeInTheDocument()
  })

  test('ignores existing source map', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await user.upload(sourceMapFileInput, files)

    const file = new File([regular.sourcemaps[0].content], regular.sourcemaps[0].fileName)
    await user.upload(sourceMapFileInput, file)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapList).toBeInTheDocument()

    const filenamesListItems = within(sourcemapList).getAllByRole('listitem')
    const fileNames = filenamesListItems.map(item => item.textContent)

    expect(fileNames).toEqual(['index-d803759c.js.map delete', 'vendor-221d27ba.js.map delete'])
  })

  // TODO
  test.skip('allows selection files using keyboard', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    sourceMapFileInput.focus()
    await user.keyboard('[Enter]')
  })
})

describe('theme', () => {
  test('renders with light theme if prefers light theme', () => {
    vi.restoreAllMocks()
    mockPrefersColorScheme(false)

    render(<App />)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light')
  })

  test('renders with dark theme if prefers dark theme', () => {
    vi.restoreAllMocks()
    mockPrefersColorScheme(true)

    render(<App />)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')
  })

  test('allows changing the theme', async () => {
    vi.restoreAllMocks()
    mockPrefersColorScheme(false)
    render(<App />)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light')
    const themeToggleButton = screen.getByRole('checkbox', { name: /toggle theme/i })
    await userEvent.click(themeToggleButton)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')

    await userEvent.click(themeToggleButton)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light')
  })
})
