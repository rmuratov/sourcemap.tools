import { useEffect, useState } from 'react'

import type { StackTrace } from './StackTrace.ts'

import { SourceMap } from './SourceMap.ts'

export function useBindingsStore(sourceMaps: SourceMap[], stackTrace?: StackTrace) {
  const [bindings, setBindings] = useState<Record<string, SourceMap>>({})

  useEffect(() => {
    if (
      Object.keys(bindings).length !== 0 &&
      (!stackTrace || stackTrace.fileNames.length === 0 || sourceMaps.length === 0)
    ) {
      setBindings({})
      return
    }

    if (stackTrace) {
      for (const fileName of stackTrace.fileNames) {
        for (const sourceMap of sourceMaps) {
          if (
            !bindings[fileName] &&
            (fileName === sourceMap.fileNameInline || fileName === sourceMap.fileName)
          ) {
            setBindings(state => ({ ...state, [fileName]: sourceMap }))
          } else if (
            bindings[fileName] &&
            !sourceMaps.find(sm => fileName === sm.fileNameInline || fileName === sm.fileName)
          ) {
            const clone = { ...bindings }
            delete clone[fileName]
            setBindings(clone)
          }
        }
      }
    }
  }, [stackTrace, sourceMaps, bindings])

  return bindings
}
