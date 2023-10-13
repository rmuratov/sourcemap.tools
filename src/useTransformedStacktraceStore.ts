import { useEffect, useState } from 'react'

import type { StackTrace } from './StackTrace.ts'

import { SourceMap } from './SourceMap.ts'
import { transform } from './transform.ts'

export function useTransformedStacktraceStore(
  bindings: Record<string, SourceMap>,
  stackTrace?: StackTrace,
) {
  const [transformedStackTrace, setTransformedStackTrace] = useState('')

  useEffect(() => {
    if (stackTrace && Object.keys(bindings).length > 0) {
      const original = transform(stackTrace, bindings)
      setTransformedStackTrace(original)
    } else if (Object.keys(bindings).length === 0) {
      setTransformedStackTrace('')
    }
  }, [stackTrace, bindings])

  return transformedStackTrace
}
