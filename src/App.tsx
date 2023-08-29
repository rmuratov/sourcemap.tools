import cx from 'clsx'
import {
  type ChangeEvent,
  type ChangeEventHandler,
  type ClipboardEventHandler,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BasicSourceMapConsumer,
  IndexedSourceMapConsumer,
  type RawIndexMap,
  type RawSourceMap,
} from 'source-map'

import { StackTrace } from './StackTrace.ts'
import { transform } from './smtool.ts'

const toggleTheme = false
const isSourceMapTextAreaEnabled = false

function App() {
  const [rawStackTrace, setRawStackTrace] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [transformedStackTrace, setTransformedStackTrace] = useState('')
  const [rawSourceMaps, setRawSourceMaps] = useState('')
  const [maps, setMaps] = useState<
    Record<string, BasicSourceMapConsumer | IndexedSourceMapConsumer | string>
  >({})

  const handleStackTraceChange: ChangeEventHandler<HTMLTextAreaElement> = event => {
    const st = new StackTrace(event.target.value.trim())
    setFiles(st.files)
    setRawStackTrace(event.target.value)
  }

  const handleSourceMapTextAreaPaste: ClipboardEventHandler<HTMLTextAreaElement> = event => {
    const sm = event.clipboardData.getData('text')

    console.log(sm)

    setRawSourceMaps(sm)

    if (sm) {
      try {
        const json = JSON.parse(sm)

        if (!maps[json.file]) {
          setMaps({ ...maps, [json.file]: json })
        }

        setRawSourceMaps('')
      } catch (e) {
        console.log('Error parsing source map', e)
      }
    }
  }

  const mappings = useMemo<Record<string, RawIndexMap | RawSourceMap | string>>(() => {
    return files.reduce((prev, curr) => {
      if (!curr || !maps[curr]) return prev

      return { ...prev, [curr]: maps[curr] }
    }, {})
  }, [files, maps])

  useEffect(() => {
    if (rawStackTrace) {
      transform(rawStackTrace, mappings).then(res => setTransformedStackTrace(res))
    }
  }, [rawStackTrace, mappings])

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return undefined
    }

    const files = event.target.files

    const mps: Record<string, BasicSourceMapConsumer | IndexedSourceMapConsumer | string> = {}

    for (const file of files) {
      const text = await file.text()

      const json = JSON.parse(text)

      mps[json.file || file.name] = text
    }

    setMaps({ ...maps, ...mps })
    event.target.value = ''
  }

  const isParseError = Boolean(rawStackTrace.trim()) && !files.length

  return (
    <div className="px-4">
      <div className="navbar px-0">
        <div className="navbar-start">
          <a className="normal-case text-xl" href="/">
            Sourcemap Tool
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
            <span className="label-text-alt">
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
                accept=".map,.js.map,.txt"
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

            {Object.keys(maps).length ? (
              <ol>
                {Object.keys(maps).map(m => (
                  <li className="font-mono" key={m}>
                    {m}
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
