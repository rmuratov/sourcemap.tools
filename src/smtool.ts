import type { StackFrame } from 'stacktrace-parser'

import {
  type NullableMappedPosition,
  type RawIndexMap,
  type RawSourceMap,
  SourceMapConsumer,
} from 'source-map'
import * as stackTraceParser from 'stacktrace-parser'

export async function transform(
  stackTrace: string,
  maps: Record<string, RawIndexMap | RawSourceMap | string>,
) {
  const { frames, message } = parseStackTrace(stackTrace)

  const newStack = [message]
  const transformed = await Promise.all(frames.map(sf => processStackFrame(sf, maps)))
  const result = newStack.concat(transformed).join('\n')
  return result
}

export type ParsedStackTrace = {
  frames: StackFrame[]
  message: string
}

export function parseStackTrace(stackTrace: string): ParsedStackTrace {
  const frames = stackTraceParser.parse(stackTrace)
  const message = extractErrorMessage(stackTrace)

  return { frames, message }
}

function extractErrorMessage(stackTrace: string) {
  return stackTrace.split('\n')[0]
}

async function processStackFrame(
  stackFrame: StackFrame,
  maps: Record<string, RawIndexMap | RawSourceMap | string>,
) {
  const originalPosition = await tryGetOriginalPosition(stackFrame, maps)

  return originalPosition
    ? generateStackTraceLine(getPosition(originalPosition))
    : generateStackTraceLine(getPosition(stackFrame))
}

async function tryGetOriginalPosition(
  stackFrame: StackFrame,
  maps: Record<string, RawIndexMap | RawSourceMap | string>,
): Promise<NullableMappedPosition | null> {
  let result: NullableMappedPosition | null = null

  const { column, file, line } = getPosition(stackFrame)

  if (!file || !maps[file] || !line || !column) {
    return null
  }

  await SourceMapConsumer.with(maps[file], null, consumer => {
    result = consumer.originalPositionFor({ column, line })
  })

  return result
}

type Position = {
  column: number
  file: string
  line: number
  method: string
}

function generateStackTraceLine(position: Position) {
  const { column, file, line, method } = position
  return `  at ${method || '<unknown>'} (${file}:${line}:${column})`
}

function getPosition(position: NullableMappedPosition | StackFrame): Position {
  let method = ''
  let file = ''
  let line = -1
  let column = -1

  if (isStackFrame(position)) {
    method = position.methodName
    file = position.file || ''
    line = position.lineNumber || -1
    column = position.column || -1
  }

  if (isNullableMappedPosition(position)) {
    method = position.name || ''
    file = position.source || ''
    line = position.line || -1
    column = position.column || -1
  }

  return { column, file, line, method }
}

function isStackFrame(position: NullableMappedPosition | StackFrame): position is StackFrame {
  return 'lineNumber' in position
}

function isNullableMappedPosition(
  position: NullableMappedPosition | StackFrame,
): position is NullableMappedPosition {
  return 'source' in position
}

export function createConsumer(rawSourceMap: string) {
  return new SourceMapConsumer(rawSourceMap)
}
