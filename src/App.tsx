import cx from 'clsx'
import {
  type ChangeEvent,
  type ChangeEventHandler,
  type ClipboardEventHandler,
  useState,
} from 'react'

import { Bindings } from './Bindings.ts'
import { SourceMap } from './SourceMap.ts'
import { StackTrace } from './StackTrace.ts'

const toggleTheme = false
const isSourceMapTextAreaEnabled = false

function App() {
  const [rawStackTrace, setRawStackTrace] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [transformedStackTrace, setTransformedStackTrace] = useState('')
  const [rawSourceMaps, setRawSourceMaps] = useState('')
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([])

  const [bindings] = useState(() => new Bindings())

  function addSourceMaps(value: Array<SourceMap | null> | SourceMap) {
    const newSourceMaps: SourceMap[] = []

    for (const sourceMap of Array.isArray(value) ? value : [value]) {
      if (sourceMap && !sourceMaps.some(s => s.isEqual(sourceMap))) {
        newSourceMaps.push(sourceMap)
      }
    }

    setSourceMaps(sourceMaps => {
      bindings.addSourceMaps([...sourceMaps, ...newSourceMaps])

      console.log('BIN', bindings)
      return [...sourceMaps, ...newSourceMaps]
    })
  }

  const handleStackTraceChange: ChangeEventHandler<HTMLTextAreaElement> = event => {
    const st = new StackTrace(event.target.value.trim())
    setFiles(st.files)

    bindings.addFileNames(st.files)
    console.log('BIN', bindings)
    setRawStackTrace(event.target.value)
  }

  const handleSourceMapTextAreaPaste: ClipboardEventHandler<HTMLTextAreaElement> = event => {
    const sm = event.clipboardData.getData('text')
    console.log(sm)
  }

  function notify(message: string) {
    console.log(message)
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const isParseError = Boolean(rawStackTrace.trim()) && !files.length

  return (
    <div className="px-4">
      <div className="navbar px-0">
        <div className="navbar-start">
          <a className="normal-case text-xl" href="/">
            UnMiniTrace
          </a>
        </div>

        {toggleTheme && (
          <div className="navbar-end">
            <button className="btn btn-primary" data-act-class="ACTIVECLASS" data-set-theme="dark">
              dark
            </button>
            <button className="btn btn-primary" data-act-class="ACTIVECLASS" data-set-theme="light">
              light
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="form-control">
          <textarea
            className={cx(
              'textarea textarea-bordered h-96 resize-none font-mono whitespace-pre leading-snug',
              isParseError && 'textarea-warning',
            )}
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
            disabled
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

            {files.length ? (
              <ol>
                {files.map(file => (
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
                multiple
                onChange={handleFileInputChange}
                type="file"
              />

              {isSourceMapTextAreaEnabled && (
                <div className="form-control">
                  <textarea
                    className="textarea textarea-bordered resize-none font-mono h-0"
                    // onChange={handleSourceMapTextAreaChange}
                    onPaste={handleSourceMapTextAreaPaste}
                    placeholder="Or paste sourcemap content here"
                    value={rawSourceMaps}
                  ></textarea>
                </div>
              )}
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
