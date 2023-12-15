import cx from 'clsx'
import { type ChangeEvent, useState } from 'react'

import { SourceMap } from './SourceMap.ts'
import { StackTrace } from './StackTrace.ts'
import { transform } from './lib.ts'
import { useSourcemapsStore } from './useSourcemapsStore.ts'

function App() {
  const [stackTraceInputValue, setStackTraceInputValue] = useState('')
  const [sourceMapInputValue, setSourceMapInputValue] = useState('')
  const { addSourceMaps, deleteSourceMap, sourceMaps } = useSourcemapsStore()

  const [isSourceMapInputError, setIsSourceMapInputError] = useState(false)
  const [isSourceMapFileInputError, setIsSourceMapFileInputError] = useState(false)

  const stackTrace = StackTrace.create(stackTraceInputValue)
  const isParseError = Boolean(stackTraceInputValue.trim()) && !stackTrace

  const transformedStackTrace = transform(sourceMaps, stackTrace)

  async function handleSourceMapFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    setIsSourceMapFileInputError(false)

    if (!event.target.files) {
      return
    }

    const sourceMaps = await Promise.all(
      Array.from(event.target.files).map(file =>
        file.text().then(text => SourceMap.create(text, file.name)),
      ),
    )

    if (sourceMaps.some(sm => !sm)) {
      setIsSourceMapFileInputError(true)
    }

    addSourceMaps(sourceMaps)

    event.target.value = ''
  }

  async function handleSourceMapTextAreaChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value

    setSourceMapInputValue(text)

    const sourceMap = await SourceMap.create(text)

    if (!sourceMap) {
      setIsSourceMapInputError(Boolean(text) && true)
      return
    }

    addSourceMaps(sourceMap)
    setSourceMapInputValue('')
    setIsSourceMapInputError(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 flex-1">
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
              onChange={event => setStackTraceInputValue(event.target.value)}
              placeholder="Paste the stack trace of the JavaScript error here"
            ></textarea>

            <label className="label">
              <span
                className={cx('label-text-alt', isParseError && 'text-warning')}
                data-testid="stacktrace-textarea-label"
              >
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

              <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
                <div className="form-control lg:col-span-2">
                  <label className="btn btn-neutral btn-block" htmlFor="sourcemap-file-input">
                    Choose files
                    <input
                      accept=".map,.txt"
                      aria-label="Source map file input"
                      className="file-input file-input-bordered"
                      data-testid="sourcemap-file-input"
                      hidden
                      id="sourcemap-file-input"
                      multiple
                      onChange={handleSourceMapFileInputChange}
                      type="file"
                    />
                  </label>
                </div>
                <div className="form-control lg:col-span-4">
                  <textarea
                    aria-label="Source map content textarea"
                    className={cx(
                      'textarea textarea-bordered resize-none font-mono h-0 whitespace-nowrap',
                      isSourceMapInputError && 'textarea-warning',
                    )}
                    data-testid="sourcemap-textarea"
                    id="sourcemap-textarea"
                    onChange={handleSourceMapTextAreaChange}
                    placeholder="Or paste the contents of the source map here"
                    value={sourceMapInputValue}
                  ></textarea>

                  {isSourceMapInputError && (
                    <label className="label">
                      <span
                        className={cx('label-text-alt text-warning')}
                        data-testid="sourcemap-textarea-label"
                      >
                        Provided text is not a source map
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {isSourceMapFileInputError && (
                <div className="alert alert-warning flex justify-between" role="alert">
                  <span>Some of the files were not source maps</span>

                  <div>
                    <button
                      className="btn btn-sm"
                      onClick={() => setIsSourceMapFileInputError(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {sourceMaps.length ? (
                <ul className="space-y-2" data-testid="sourcemaps-list">
                  {sourceMaps.map(m => (
                    <li className="font-mono list-disc list-inside" key={m.id}>
                      {m.fileName ?? m.fileNameInline ?? `NO NAME (Generated id: ${m.id})`}{' '}
                      <button
                        className="btn btn-error btn-outline btn-xs inline"
                        onClick={() => {
                          deleteSourceMap(m.id)
                        }}
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

      <footer className="footer bg-base-200 p-4 mt-8">
        <nav>
          <a className="link link-hover" href="https://github.com/rmuratov/sourcemap.tools">
            GitHub
          </a>
        </nav>
      </footer>
    </div>
  )
}

export default App
