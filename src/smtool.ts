import type { StackFrame } from 'stacktrace-parser'

import { type NullableMappedPosition } from 'source-map'

import type { SourceMap } from './SourceMap.ts'
import type { StackTrace } from './StackTrace.ts'

export function transform(stackTrace: StackTrace, bindings: Record<string, SourceMap>) {
  const newStack = [stackTrace.message || '']
  const transformed = stackTrace.frames.map(sf => processStackFrame(sf, bindings))
  return newStack.concat(transformed).join('\n')
}

function processStackFrame(stackFrame: StackFrame, bindings: Record<string, SourceMap>) {
  const originalPosition = tryGetOriginalPosition(stackFrame, bindings)

  return originalPosition
    ? generateStackTraceLine(getPosition(originalPosition))
    : generateStackTraceLine(getPosition(stackFrame))
}

function tryGetOriginalPosition(
  stackFrame: StackFrame,
  bindings: Record<string, SourceMap>,
): NullableMappedPosition | null {
  let result: NullableMappedPosition | null = null

  const { column, file, line } = getPosition(stackFrame)

  if (!file || !bindings[file] || !line || !column) {
    return null
  }

  result = bindings[file].consumer.originalPositionFor({ column, line })

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
