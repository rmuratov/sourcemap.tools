import { useState } from 'react'

import { StackTrace } from './StackTrace.ts'

export function useStackTraceStore() {
  const [rawStackTrace, setRawStackTrace] = useState<string>('')
  const [stackTrace, setStackTrace] = useState<StackTrace>()

  const handleStackTraceChange = (rawStackTrace: string) => {
    setRawStackTrace(rawStackTrace)

    const parsedStackTrace = StackTrace.create(rawStackTrace)

    if (parsedStackTrace) {
      setStackTrace(parsedStackTrace)
    }
  }

  const isParseError = Boolean(rawStackTrace.trim()) && !stackTrace?.fileNames.length

  return { isParseError, rawStackTrace, setStackTrace: handleStackTraceChange, stackTrace }
}
