import cx from 'clsx'
import { type ChangeEvent, useState } from 'react'

import { SourceMap } from './SourceMap.ts'
import { StackTrace } from './StackTrace.ts'
import { calcBindings } from './calcBindings.ts'
import { transform } from './transform.ts'
import { useSourcemapsStore } from './useSourcemapsStore.ts'

function App() {
  const [rawSourceMap, setRawSourceMap] = useState('')
  const { addSourceMaps, deleteSourceMap, sourceMaps } = useSourcemapsStore()

  const [rawStackTrace, setRawStackTrace] = useState<string>('')

  const stackTrace = StackTrace.create(rawStackTrace) || undefined
  const isParseError = Boolean(rawStackTrace.trim()) && !stackTrace

  const bindings = calcBindings(sourceMaps, stackTrace)
  const transformedStackTrace = transform(bindings, stackTrace)

  async function handleSourceMapFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) {
      return undefined
    }

    const maybeSourceMaps = await Promise.all(
      Array.from(event.target.files).map(file =>
        file.text().then(text => SourceMap.create(text, file.name)),
      ),
    )

    if (maybeSourceMaps.some(sm => !sm)) {
      notify('It seems that some files are not source maps')
    }

    addSourceMaps(maybeSourceMaps)

    event.target.value = ''
  }

  async function handleSourceMapTextAreaChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value

    setRawSourceMap(text)

    const sm = await SourceMap.create(text)

    if (!sm) {
      notify('It seems that the text you pasted is not a source map')
      return
    }

    addSourceMaps(sm)
    setRawSourceMap('')
  }

  function notify(message: string) {
    // TODO: Implement notifications
    console.log(message)
  }

  return (
    <div className="px-4">
      <div className="navbar px-0">
        <div className="navbar-start">
          <a className="normal-case text-xl" href="/">
            sourcemap.tools
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="form-control">
          <textarea
            aria-label="Minified stack trace"
            autoFocus
            className={cx(
              'textarea textarea-bordered h-96 resize-none font-mono whitespace-pre leading-snug',
              isParseError && 'textarea-warning',
            )}
            data-testid="stacktrace-textarea"
            onChange={event => setRawStackTrace(event.target.value)}
            placeholder="Paste the stack trace of the JavaScript error here"
          ></textarea>

          <label className="label">
            <span className={cx('label-text-alt', isParseError && 'text-warning')}>
              {isParseError
                ? 'It seems that the text you pasted is not a stack trace'
                : 'Paste the stack trace here'}
            </span>
          </label>
        </div>

        <div className="form-control">
          <textarea
            aria-label="Original stack trace"
            className="textarea textarea-bordered  h-96 resize-none font-mono whitespace-pre leading-snug"
            data-testid="result-textarea"
            readOnly
            value={transformedStackTrace}
          ></textarea>

          <label className="label">
            <span className="label-text-alt">See the results here</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-5">
        <div className="card card-bordered card-compact rounded-lg">
          <div className="card-body">
            <h2 className="card-title">Extracted file names</h2>

            {stackTrace?.fileNames.length ? (
              <ul className="space-y-2" data-testid="filenames-list">
                {stackTrace.fileNames.map(fileName => (
                  <li className="font-mono list-disc list-inside" key={fileName}>
                    {fileName}
                  </li>
                ))}
              </ul>
            ) : (
              'No file names. Please provide the stack trace.'
            )}
          </div>
        </div>

        <div className="card card-bordered card-compact rounded-lg">
          <div className="card-body">
            <h2 className="card-title">Source maps</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <input
                accept=".map,.txt"
                aria-label="Source map file input"
                className="file-input file-input-bordered"
                data-testid="sourcemap-file-input"
                id="sourcemap-file-input"
                multiple
                onChange={handleSourceMapFileInputChange}
                type="file"
              />

              <div className="form-control">
                <textarea
                  aria-label="Source map content textarea"
                  className="textarea textarea-bordered resize-none font-mono h-0"
                  data-testid="sourcemap-textarea"
                  id="sourcemap-textarea"
                  onChange={handleSourceMapTextAreaChange}
                  placeholder="Or paste the contents of the source map here"
                  value={rawSourceMap}
                ></textarea>
              </div>
            </div>

            {sourceMaps.length ? (
              <ul className="space-y-2" data-testid="sourcemaps-list">
                {sourceMaps.map(m => (
                  <li className="font-mono list-disc list-inside" key={m.id}>
                    {m.fileName || m.fileNameInline || `NO NAME (Generated id: ${m.id})`}{' '}
                    <button
                      className="btn btn-error btn-outline btn-xs inline"
                      onClick={() => deleteSourceMap(m.id)}
                    >
                      delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              'No sourcemaps.'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
