import { useEffect, useState } from 'react'

import type { StackTrace } from './StackTrace.ts'

import { SourceMap } from './SourceMap.ts'

export function useBindingsStore(sourceMaps: SourceMap[], stackTrace?: StackTrace) {
  const [bindings, setBindings] = useState<Record<string, SourceMap>>({})

  useEffect(() => {
    if (stackTrace) {
      for (const fileName of stackTrace.files) {
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
  }, [stackTrace, sourceMaps, bindings])

  return bindings
}
