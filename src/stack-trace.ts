import type { StackFrame } from 'stacktrace-parser'

import { parse } from 'stacktrace-parser'

export interface StackTraceLine {
  frame: null | StackFrame
  raw: string
}

export class StackTrace {
  fileNames: string[]
  lines: StackTraceLine[]

  constructor(rawStackTrace: string) {
    // Parse line by line so that lines the parser does not recognize
    // (error messages, async markers, cause chains) keep their raw text.
    this.lines = rawStackTrace.split('\n').map(raw => ({
      frame: parse(raw)[0] ?? null,
      raw,
    }))

    this.fileNames = this.#extractFileNames(this.lines)
  }

  static create(rawStackTrace: string) {
    const trimmed = rawStackTrace.trim()

    if (!trimmed) {
      return null
    }

    const stackTrace = new StackTrace(rawStackTrace)

    if (stackTrace.lines.every(line => !line.frame)) {
      return null
    }

    return stackTrace
  }

  #extractFileNames(lines: StackTraceLine[]) {
    const files = new Set<string>()

    lines.forEach(line => line.frame?.file && files.add(line.frame.file))

    return Array.from(files)
  }
}
