import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ChangeEvent, StrictMode } from 'react'
import { SourceMapConsumer, SourceMapGenerator } from 'source-map'
import { describe, expect, test, vi } from 'vitest'

import App from '../app.tsx'
import { SourceMap } from '../source-map.ts'
import { StackTrace } from '../stack-trace.ts'
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

    expect(fileNames).toEqual(['index-F7qoIhl0.js', 'vendor-B_FE3Fnm.js'])
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
    expect(resultTextArea).toHaveValue(regular.reconstructed)

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

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapList).toBeInTheDocument()

    expect(within(sourcemapList).getByRole('listitem')).toHaveTextContent('index-F7qoIhl0.js')
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

    await waitFor(() => expect(resultTextArea).toHaveValue(regular.reconstructed))
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

    expect(fileNames).toEqual(['index-F7qoIhl0.js.map delete', 'vendor-B_FE3Fnm.js.map delete'])
  })

  test('allows opening file selector using keyboard', () => {
    render(<App />)

    // Get the label element that handles keyboard interaction
    const fileUploadButton = screen.getByRole('button', { name: /choose files/i })

    // Verify the button is focusable
    expect(fileUploadButton).toHaveAttribute('tabIndex', '0')

    // Focus the button
    fileUploadButton.focus()
    expect(fileUploadButton).toHaveFocus()

    // Mock the click method to test that it gets called by the keydown handler
    const clickSpy = vi.spyOn(fileUploadButton, 'click')

    // Other keys must not open the file selector
    fireEvent.keyDown(fileUploadButton, { code: 'KeyA' })
    expect(clickSpy).not.toHaveBeenCalled()

    // Fire the keydown event with Enter
    fireEvent.keyDown(fileUploadButton, { code: 'Enter' })

    // Verify that the keydown handler called click() on the current target
    expect(clickSpy).toHaveBeenCalledOnce()

    clickSpy.mockRestore()
  })

  test('handles null files in file input', () => {
    render(<App />)

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)

    // Create a mock event with null files
    const mockEvent = {
      target: { files: null },
    } as unknown as ChangeEvent<HTMLInputElement>

    // Trigger the change event directly
    fireEvent.change(sourceMapFileInput, mockEvent)

    // Should not crash and no source maps should be added
    const sourcemapList = screen.queryByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapList).not.toBeInTheDocument()
  })

  test('displays fallback name when source map has no fileName or fileNameInline', async () => {
    render(<App />)
    const user = userEvent.setup()

    // Create a source map with no filename info
    const sourcemapContent = JSON.stringify({
      mappings: 'AAAA',
      names: [],
      sources: ['test.js'],
      version: 3,
    })

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })
    sourcemapTextarea.focus()
    await user.paste(sourcemapContent)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    const listItem = within(sourcemapList).getByRole('listitem')

    // Should display the fallback with generated ID
    expect(listItem).toHaveTextContent(/NO NAME \(Generated id:/)
  })

  test('decodes base64 data URL source map pasted into textarea', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    const dataUrl = `data:application/json;base64,${Buffer.from(regular.sourcemaps[0].content).toString('base64')}`

    sourcemapTextarea.focus()
    await user.paste(dataUrl)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(within(sourcemapList).getByRole('listitem')).toHaveTextContent('index-F7qoIhl0.js')
  })

  test('decodes base64 data URL with charset parameter', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    const dataUrl = `data:application/json;charset=utf-8;base64,${Buffer.from(regular.sourcemaps[0].content).toString('base64')}`

    sourcemapTextarea.focus()
    await user.paste(dataUrl)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(within(sourcemapList).getByRole('listitem')).toHaveTextContent('index-F7qoIhl0.js')
  })

  test('shows warning for malformed base64 data URL', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    sourcemapTextarea.focus()
    await user.paste('data:application/json;base64,!!!not-valid-base64!!!')

    const warning = await screen.findByText(/provided text is not a source map/i)
    expect(warning).toBeInTheDocument()

    // The original (undecoded) value should remain in the textarea so the user can fix it.
    expect(sourcemapTextarea).toHaveValue('data:application/json;base64,!!!not-valid-base64!!!')
  })

  test('treats plain source map text as non-base64', async () => {
    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    sourcemapTextarea.focus()
    await user.paste(regular.sourcemaps[1].content)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(within(sourcemapList).getByRole('listitem')).toHaveTextContent('vendor-B_FE3Fnm.js')
  })
})

// destroy() lives on the prototype of the concrete consumer class, which the
// library does not export, so grab it from a throwaway instance.
async function spyOnConsumerDestroy() {
  const consumer = await new SourceMapConsumer(regular.sourcemaps[0].content)
  const prototype = Object.getPrototypeOf(consumer) as { destroy: () => void }
  consumer.destroy()
  return vi.spyOn(prototype, 'destroy')
}

describe('source map lifecycle', () => {
  test('destroys the consumer of a rejected duplicate source map', async () => {
    const destroySpy = await spyOnConsumerDestroy()

    render(<App />)
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const makeFile = () => new File([regular.sourcemaps[0].content], regular.sourcemaps[0].fileName)

    await user.upload(sourceMapFileInput, makeFile())
    await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(destroySpy).not.toHaveBeenCalled()

    await user.upload(sourceMapFileInput, makeFile())
    await waitFor(() => expect(destroySpy).toHaveBeenCalledOnce())

    const sourcemapList = screen.getByRole('list', { name: /sourcemaps list/i })
    expect(within(sourcemapList).getAllByRole('listitem')).toHaveLength(1)

    destroySpy.mockRestore()
  })

  test('adds a source map only once when identical files are selected together', async () => {
    const destroySpy = await spyOnConsumerDestroy()

    render(<App />)
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = [
      new File([regular.sourcemaps[0].content], 'copy-one.js.map'),
      new File([regular.sourcemaps[0].content], 'copy-two.js.map'),
    ]

    await user.upload(sourceMapFileInput, files)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(within(sourcemapList).getAllByRole('listitem')).toHaveLength(1)
    expect(destroySpy).toHaveBeenCalledOnce()

    destroySpy.mockRestore()
  })

  test('destroys the consumer exactly once when deleting under StrictMode', async () => {
    const destroySpy = await spyOnConsumerDestroy()

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    const user = userEvent.setup()

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const file = new File([regular.sourcemaps[0].content], regular.sourcemaps[0].fileName)
    await user.upload(sourceMapFileInput, file)

    const deleteButton = await screen.findByRole('button', { name: 'delete' })
    await user.click(deleteButton)

    const sourcemapList = screen.queryByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapList).not.toBeInTheDocument()
    expect(destroySpy).toHaveBeenCalledOnce()

    destroySpy.mockRestore()
  })
})

describe('source map input race', () => {
  // Delays the first SourceMap.create call so that a subsequent input event
  // can finish parsing before the first one does.
  function delayFirstSourceMapCreate(delayMs: number) {
    const originalCreate = SourceMap.create.bind(SourceMap)
    const createSpy = vi.spyOn(SourceMap, 'create')

    createSpy.mockImplementation(originalCreate)
    createSpy.mockImplementationOnce(async (text, fileName) => {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return originalCreate(text, fileName)
    })

    return createSpy
  }

  test('discards a stale successful parse instead of wiping newer input', async () => {
    const createSpy = delayFirstSourceMapCreate(100)
    const destroySpy = await spyOnConsumerDestroy()

    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    // Slow parse of a valid source map...
    sourcemapTextarea.focus()
    await user.paste(regular.sourcemaps[0].content)

    // ...superseded by newer input before it finishes.
    await user.clear(sourcemapTextarea)
    await user.paste('lorem ipsum')

    expect(sourcemapTextarea).toHaveValue('lorem ipsum')

    // Let the delayed parse resolve.
    await new Promise(resolve => setTimeout(resolve, 150))

    // The stale result must not clear the textarea or add the source map,
    // and its consumer must be destroyed.
    expect(sourcemapTextarea).toHaveValue('lorem ipsum')
    expect(screen.getByText(/provided text is not a source map/i)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /sourcemaps list/i })).not.toBeInTheDocument()
    expect(destroySpy).toHaveBeenCalledOnce()

    destroySpy.mockRestore()
    createSpy.mockRestore()
  })

  test('discards a stale failed parse instead of overriding a newer success', async () => {
    const createSpy = delayFirstSourceMapCreate(100)

    render(<App />)
    const user = userEvent.setup()

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })

    // Slow parse of text that is not a source map...
    sourcemapTextarea.focus()
    await user.paste('lorem ipsum')

    // ...superseded by a valid source map.
    await user.clear(sourcemapTextarea)
    await user.paste(regular.sourcemaps[0].content)

    const sourcemapList = await screen.findByRole('list', { name: /sourcemaps list/i })
    expect(sourcemapTextarea).toHaveValue('')

    // Let the delayed parse resolve.
    await new Promise(resolve => setTimeout(resolve, 150))

    // The stale failure must not show the error for the accepted source map.
    expect(sourcemapList).toBeInTheDocument()
    expect(sourcemapTextarea).toHaveValue('')
    expect(screen.queryByText(/provided text is not a source map/i)).not.toBeInTheDocument()

    createSpy.mockRestore()
  })
})

describe('column numbers', () => {
  // Generated line 1 has mappings at 0-based columns 0, 10, and 11 which lead
  // to different original lines, so an off-by-one in the column conversion
  // resolves to a wrong original position.
  function createCraftedSourceMap() {
    const generator = new SourceMapGenerator({ file: 'crafted.min.js' })

    generator.addMapping({
      generated: { column: 0, line: 1 },
      name: 'start',
      original: { column: 0, line: 1 },
      source: 'original.ts',
    })
    generator.addMapping({
      generated: { column: 10, line: 1 },
      name: 'first',
      original: { column: 2, line: 5 },
      source: 'original.ts',
    })
    generator.addMapping({
      generated: { column: 11, line: 1 },
      name: 'second',
      original: { column: 4, line: 9 },
      source: 'original.ts',
    })

    return generator.toString()
  }

  test('converts 1-based stack trace columns to the 0-based source map convention and back', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    // 1-based column 11 is 0-based column 10, so it must resolve to `first`,
    // not to the mapping at 0-based column 11 (`second`).
    await user.type(stacktraceTextarea, 'Error: boom\n  at crafted.min.js:1:11')

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })
    sourcemapTextarea.focus()
    await user.paste(createCraftedSourceMap())

    await waitFor(() =>
      expect(resultTextArea).toHaveValue('Error: boom\n  at first (original.ts:5:3)'),
    )
  })

  test('transforms frames with column 0', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, 'Error: boom\n  at crafted.min.js:1:0')

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })
    sourcemapTextarea.focus()
    await user.paste(createCraftedSourceMap())

    await waitFor(() =>
      expect(resultTextArea).toHaveValue('Error: boom\n  at start (original.ts:1:1)'),
    )
  })

  test('keeps the original frame when the position is not in the source map', async () => {
    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    // Line 2 has no mappings, so the frame must stay as is instead of
    // becoming `null:null:null`.
    await user.type(stacktraceTextarea, 'Error: boom\n  at crafted.min.js:2:1')

    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })
    sourcemapTextarea.focus()
    await user.paste(createCraftedSourceMap())

    await waitFor(() =>
      expect(resultTextArea).toHaveValue('Error: boom\n  at (crafted.min.js:2:1)'),
    )
  })
})

describe('memoization', () => {
  // originalPositionFor() lives on the prototype of the concrete consumer
  // class, which the library does not export, so grab it from a throwaway
  // instance. Every transformation calls it for each mapped stack frame.
  async function spyOnConsumerOriginalPositionFor() {
    const consumer = await new SourceMapConsumer(regular.sourcemaps[0].content)
    const prototype = Object.getPrototypeOf(consumer) as {
      originalPositionFor: (...args: unknown[]) => unknown
    }
    consumer.destroy()
    return vi.spyOn(prototype, 'originalPositionFor')
  }

  test('does not re-parse the stack trace on unrelated re-renders', async () => {
    const createSpy = vi.spyOn(StackTrace, 'create')

    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    await user.type(stacktraceTextarea, regular.stacktrace)
    expect(createSpy).toHaveBeenCalled()

    createSpy.mockClear()

    // Typing into the source map textarea re-renders the app but must not
    // re-parse the unchanged stack trace.
    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })
    sourcemapTextarea.focus()
    await user.paste('lorem ipsum')
    await screen.findByText(/provided text is not a source map/i)

    expect(createSpy).not.toHaveBeenCalled()

    createSpy.mockRestore()
  })

  test('does not re-run the transformation on unrelated re-renders', async () => {
    const positionSpy = await spyOnConsumerOriginalPositionFor()

    render(<App />)
    const user = userEvent.setup()

    const stacktraceTextarea = screen.getByRole('textbox', { name: /minified stack trace/i })
    const resultTextArea = screen.getByRole('textbox', { name: /original stack trace/i })

    await user.type(stacktraceTextarea, regular.stacktrace)

    const sourceMapFileInput = screen.getByLabelText(/choose files/i)
    const files = regular.sourcemaps.map(sm => new File([sm.content], sm.fileName))
    await user.upload(sourceMapFileInput, files)

    await waitFor(() => expect(resultTextArea).toHaveValue(regular.result))
    expect(positionSpy).toHaveBeenCalled()

    positionSpy.mockClear()

    // Typing into the source map textarea re-renders the app but must not
    // re-transform the unchanged stack trace.
    const sourcemapTextarea = screen.getByRole('textbox', { name: /source map/i })
    sourcemapTextarea.focus()
    await user.paste('lorem ipsum')
    await screen.findByText(/provided text is not a source map/i)

    expect(positionSpy).not.toHaveBeenCalled()
    expect(resultTextArea).toHaveValue(regular.result)

    positionSpy.mockRestore()
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
