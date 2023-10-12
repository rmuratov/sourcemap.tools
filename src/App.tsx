import cx from 'clsx'
import { type ChangeEvent, type ClipboardEvent, useState } from 'react'

import { SourceMap } from './SourceMap.ts'
import { useBindingsStore } from './useBindingsStore.ts'
import { useSourcemapsStore } from './useSourcemapsStore.ts'
import { useStackTraceStore } from './useStackTraceStore.ts'
import { useTransformedStacktraceStore } from './useTransformedStacktraceStore.ts'

function App() {
  const { isParseError, setStackTrace, stackTrace } = useStackTraceStore()
  const [rawSourceMaps, setRawSourceMaps] = useState('')
  const { addSourceMaps, deleteSourceMap, sourceMaps } = useSourcemapsStore()
  const bindings = useBindingsStore(sourceMaps, stackTrace)
  const transformedStackTrace = useTransformedStacktraceStore(bindings, stackTrace)

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
      notify('Some of the provided files were not sourcemaps')
    }

    addSourceMaps(maybeSourceMaps)

    event.target.value = ''
  }

  function handleSourceMapTextAreaPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const sm = event.clipboardData.getData('text')
    console.log(sm)
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
            autoFocus
            className={cx(
              'textarea textarea-bordered h-96 resize-none font-mono whitespace-pre leading-snug',
              isParseError && 'textarea-warning',
            )}
            data-testid="stacktrace-textarea"
            onChange={event => setStackTrace(event.target.value)}
            placeholder="Paste JavaScript error stack trace here"
          ></textarea>

          <label className="label">
            <span className={cx('label-text-alt', isParseError && 'text-warning')}>
              {isParseError
                ? 'Provided input appears not to be a stack trace'
                : 'Put stack trace here'}
            </span>
          </label>
        </div>

        <div className="form-control">
          <textarea
            className="textarea textarea-bordered  h-96 resize-none font-mono whitespace-pre leading-snug"
            data-testid="result-textarea"
            readOnly
            value={transformedStackTrace}
          ></textarea>

          <label className="label">
            <span className="label-text-alt">See result here</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-5">
        <div className="card card-bordered card-compact rounded-lg">
          <div className="card-body">
            <h2 className="card-title">Extracted file names</h2>

            {stackTrace?.files.length ? (
              <ul className="space-y-2" data-testid="filenames-list">
                {stackTrace.files.map(file => (
                  <li className="font-mono list-disc list-inside" key={file}>
                    {file}
                  </li>
                ))}
              </ul>
            ) : (
              'No file names. Provide your stack trace to see file names.'
            )}
          </div>
        </div>

        <div className="card card-bordered card-compact rounded-lg">
          <div className="card-body">
            <h2 className="card-title">Source maps</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <input
                accept=".map,.txt"
                className="file-input file-input-bordered"
                data-testid="sourcemap-file-input"
                multiple
                onChange={handleSourceMapFileInputChange}
                type="file"
              />

              <div className="form-control">
                <textarea
                  className="textarea textarea-bordered resize-none font-mono h-0"
                  disabled
                  onChange={event => setRawSourceMaps(event.target.value)}
                  onPaste={handleSourceMapTextAreaPaste}
                  placeholder="Or paste sourcemap content here"
                  value={rawSourceMaps}
                ></textarea>
              </div>
            </div>

            {sourceMaps.length ? (
              <ul className="space-y-2">
                {sourceMaps.map(m => (
                  <li className="font-mono list-disc list-inside" key={m.id}>
                    {m.fileName || m.fileNameInline || `NO NAME (Generated id: ${m.id})`}{' '}
                    <button className="btn btn-xs inline" onClick={() => deleteSourceMap(m.id)}>
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
