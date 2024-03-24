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

    const files = event.target.files ?? []

    const sourceMaps = await Promise.all(
      Array.from(files).map(file => file.text().then(text => SourceMap.create(text, file.name))),
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

          <div className="navbar-end">
            <div className="flex items-center">
              <a className="btn btn-sm" href="https://github.com/rmuratov/sourcemap.tools">
                Star
                <svg
                  height="20"
                  viewBox="0 0 96 98"
                  width="20.4"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                    fill="#24292f"
                    fillRule="evenodd"
                  />
                </svg>
              </a>
            </div>
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
              onChange={event => setStackTraceInputValue(event.target.value)}
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
              <h2 className="card-title" id="filenames-list-header">
                Extracted file names
              </h2>

              {stackTrace?.fileNames.length ? (
                <ul aria-labelledby="filenames-list-header" className="space-y-2">
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
                  <label
                    className="btn btn-neutral btn-block"
                    htmlFor="sourcemap-file-input"
                    id="file-upload-button"
                    onKeyDown={event => {
                      if (event.code === 'Enter') {
                        event.currentTarget.click()
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    Choose files
                    <input
                      accept=".map,.txt"
                      aria-labelledby="file-upload-button"
                      className="file-input file-input-bordered"
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
                    id="sourcemap-textarea"
                    onChange={handleSourceMapTextAreaChange}
                    placeholder="Or paste the contents of the source map here"
                    value={sourceMapInputValue}
                  ></textarea>

                  {isSourceMapInputError && (
                    <label className="label">
                      <span className={cx('label-text-alt text-warning')}>
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
                <ul aria-label="Sourcemaps list" className="space-y-2">
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
