import cx from 'clsx'
import {
  type ChangeEvent,
  type ChangeEventHandler,
  type ClipboardEvent,
  useEffect,
  useState,
} from 'react'

import { SourceMap } from './SourceMap.ts'
import { StackTrace } from './StackTrace.ts'
import { transform } from './smtool.ts'

function App() {
  /**
   * Stack trace state
   */
  const [rawStackTrace, setRawStackTrace] = useState<string>('')
  const [parsedStackTrace, setParsedStackTrace] = useState<StackTrace>()
  const [transformedStackTrace, setTransformedStackTrace] = useState('')

  /**
   * Sourcemaps state
   */
  const [rawSourceMaps, setRawSourceMaps] = useState('')
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([])

  /**
   * Bindings state
   */
  const [bindings, setBindings] = useState<Record<string, SourceMap>>({})

  /**
   * Process stacktrace
   */
  const handleStackTraceChange: ChangeEventHandler<HTMLTextAreaElement> = event => {
    const parsedStackTrace = new StackTrace(event.target.value.trim())
    setParsedStackTrace(parsedStackTrace)
    setRawStackTrace(event.target.value)
  }

  /**
   * Process sourcemaps
   */
  function readFileContent(file: File): Promise<string> {
    // It should be just `return file.text()` but for some reason it does not work with vitest + RTL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = function (evt) {
        if (evt.target && typeof evt.target.result === 'string') {
          resolve(evt.target?.result)
        } else {
          resolve('')
        }
      }
      reader.onerror = function (evt) {
        reject(evt)
      }
    })
  }

  async function handleSourceMapFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) {
      return undefined
    }

    const maybeSourceMaps = await Promise.all(
      Array.from(event.target.files).map(file =>
        readFileContent(file).then(text => SourceMap.create(text, file.name)),
      ),
    )

    if (maybeSourceMaps.some(sm => !sm)) {
      notify('Some of the provided files were not sourcemaps')
    }

    addSourceMaps(maybeSourceMaps)

    event.target.value = ''
  }

  function addSourceMaps(value: Array<SourceMap | null> | SourceMap) {
    const newSourceMaps: SourceMap[] = []

    for (const sourceMap of Array.isArray(value) ? value : [value]) {
      if (sourceMap && !sourceMaps.some(s => s.isEqual(sourceMap))) {
        newSourceMaps.push(sourceMap)
      }
    }

    setSourceMaps(sourceMaps => [...sourceMaps, ...newSourceMaps])
  }

  function handleSourceMapTextAreaPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const sm = event.clipboardData.getData('text')
    console.log(sm)
  }

  /**
   * Process bindings
   */
  useEffect(() => {
    if (parsedStackTrace) {
      for (const fileName of parsedStackTrace.files) {
        for (const sourceMap of sourceMaps) {
          if (
            !bindings[fileName] &&
            (fileName === sourceMap.fileNameInline || fileName === sourceMap.fileName)
          ) {
            setBindings(state => ({ ...state, [fileName]: sourceMap }))
          }
        }
      }
    }
  }, [parsedStackTrace, sourceMaps, bindings])

  /**
   * Transform stacktrace
   */
  useEffect(() => {
    if (parsedStackTrace && Object.keys(bindings).length > 0) {
      const original = transform(parsedStackTrace, bindings)
      setTransformedStackTrace(original)
    }
  }, [parsedStackTrace, bindings])

  /**
   * General
   */
  function notify(message: string) {
    console.log(message)
  }

  const isParseError = Boolean(rawStackTrace.trim()) && !parsedStackTrace?.files.length

  return (
    <div className="px-4">
      <div className="navbar px-0">
        <div className="navbar-start">
          <a className="normal-case text-xl" href="/">
            UnMiniTrace
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="form-control">
          <textarea
            className={cx(
              'textarea textarea-bordered h-96 resize-none font-mono whitespace-pre leading-snug',
              isParseError && 'textarea-warning',
            )}
            data-testid="stacktrace-textarea"
            onChange={handleStackTraceChange}
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

            {parsedStackTrace?.files.length ? (
              <ol data-testid="filenames-list">
                {parsedStackTrace.files.map(file => (
                  <li className="font-mono" key={file}>
                    {file}
                  </li>
                ))}
              </ol>
            ) : (
              'No file names yet. Provide your stack trace to see file names.'
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
                  onChange={event => setRawSourceMaps(event.target.value)}
                  onPaste={handleSourceMapTextAreaPaste}
                  placeholder="Or paste sourcemap content here"
                  value={rawSourceMaps}
                ></textarea>
              </div>
            </div>

            {sourceMaps.length ? (
              <ol>
                {sourceMaps.map(m => (
                  <li className="font-mono" key={m.id}>
                    {m.fileNameInline || m.fileName || 'NO NAME'}
                  </li>
                ))}
              </ol>
            ) : (
              'No sourcemaps yet.'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
