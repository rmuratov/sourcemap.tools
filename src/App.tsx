import React, { ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  BasicSourceMapConsumer,
  IndexedSourceMapConsumer,
  RawIndexMap,
  RawSourceMap,
} from 'source-map'
import { themeChange } from 'theme-change'

import { createConsumer, parse, transform } from './smtool.ts'

function App() {
  const [rawStackTrace, setRawStackTrace] = useState('')
  const [transformedStackTrace, setTransformedStackTrace] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [maps, setMaps] = useState<
    Record<string, BasicSourceMapConsumer | IndexedSourceMapConsumer | string>
  >({})
  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = event => {
    setRawStackTrace(event.target.value)
    console.log()
  }

  const mappings = useMemo<Record<string, RawIndexMap | RawSourceMap | string>>(() => {
    return files.reduce((p, c) => {
      return {
        ...p,
        [c]: maps[c],
      }
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

      console.log(text, json)

      const consumer = await createConsumer(json)

      mps[json.file || file.name] = text
    }

    setMaps({ ...maps, ...mps })
    event.target.value = ''
  }

  useEffect(() => {
    const parsed = parse(rawStackTrace)
    setFiles(parsed.files)
  }, [rawStackTrace])

  useEffect(() => {
    themeChange(false)
  }, [])

  return (
    <div className="px-4">
      <div className="navbar px-0">
        <div className="navbar-start">
          <a className="normal-case text-xl" href="/">
            Sourcemap Tool
          </a>
        </div>

        <div className="navbar-end">
          <button className="btn btn-primary" data-act-class="ACTIVECLASS" data-set-theme="dark">
            dark
          </button>
          <button className="btn btn-primary" data-act-class="ACTIVECLASS" data-set-theme="light">
            light
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="form-control">
          <textarea
            className="textarea textarea-bordered h-96 resize-none font-mono"
            onChange={handleChange}
            placeholder="Paste JavaScript error stack trace here"
          ></textarea>

          <label className="label">
            <span className="label-text-alt">Put stack trace here</span>
          </label>
        </div>

        <div className="form-control">
          <textarea
            className="textarea textarea-bordered  h-96 resize-none font-mono overflow-x-scroll"
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
            <h2 className="card-title">File names</h2>

            {files.length ? (
              <ol>
                {files.map(f => (
                  <li className="font-mono" key={f}>
                    {f}
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

              <div className="form-control">
                <textarea
                  className="textarea textarea-bordered resize-none font-mono h-0"
                  onChange={handleChange}
                  placeholder="Paste sourcemap content"
                ></textarea>
              </div>
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
