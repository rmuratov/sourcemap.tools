import cx from 'clsx'
import { type ChangeEvent, useState } from 'react'

import { GitHubLogo } from './GitHubLogo.tsx'
import { transform } from './lib.ts'
import { SourceMap } from './SourceMap.ts'
import { StackTrace } from './StackTrace.ts'
import { ThemeToggle } from './ThemeToggle.tsx'
import { useSourcemapsStore } from './useSourcemapsStore.ts'
import { setTheme, useTheme } from './useTheme.ts'

function App() {
  const [stackTraceInputValue, setStackTraceInputValue] = useState('')
  const [sourceMapInputValue, setSourceMapInputValue] = useState('')
  const { addSourceMaps, deleteSourceMap, sourceMaps } = useSourcemapsStore()

  const [isSourceMapInputError, setIsSourceMapInputError] = useState(false)
  const [isSourceMapFileInputError, setIsSourceMapFileInputError] = useState(false)

  const theme = useTheme()

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
    <main
      className={cx('min-h-screen flex flex-col', theme === 'dark' && 'dark')}
      data-theme={theme}
    >
      <div className="px-4 flex-1 2xl:container 2xl:mx-auto">
        <nav className="navbar px-0">
          <div className="navbar-start">
            <a className="normal-case text-xl" href="/">
              sourcemap.tools
            </a>
          </div>

          <div className="navbar-end">
            <div className="flex items-center gap-x-2">
              <a
                className="btn btn-sm btn-neutral"
                href="https://github.com/rmuratov/sourcemap.tools"
              >
                Star
                <GitHubLogo />
              </a>

              <ThemeToggle onChange={setTheme} theme={theme} />
            </div>
          </div>
        </nav>

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
          <div className="card card-bordered card-compact rounded-lg border-neutral-content dark:border-opacity-20">
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

          <div className="card card-bordered card-compact rounded-lg border-neutral-content dark:border-opacity-20">
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

      <footer className="footer bg-base-200 py-4 mt-8">
        <nav className="px-4 2xl:container 2xl:mx-auto">
          <a className="link link-hover" href="https://github.com/rmuratov/sourcemap.tools">
            GitHub
          </a>
        </nav>
      </footer>
    </main>
  )
}

export default App
