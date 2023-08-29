import type { StackFrame } from 'stacktrace-parser'

import { parse } from 'stacktrace-parser'

export class StackTrace {
  files: string[]
  frames: StackFrame[]
  message: string

  constructor(rawStackTrace: string) {
    const frames = parse(rawStackTrace)

    this.frames = frames
    this.message = this.#extractErrorMessage(rawStackTrace)
    this.files = this.#extractFileNames(frames)
  }

  #extractErrorMessage(stackTrace: string) {
    return stackTrace.split('\n')[0]
  }

  #extractFileNames(frames: StackFrame[]) {
    const files: Set<string> = new Set()

    frames.forEach(f => f.file && files.add(f.file))

    return Array.from(files)
  }
}

export type ParsedStackTrace = {
  frames: StackFrame[]
  message: string
}