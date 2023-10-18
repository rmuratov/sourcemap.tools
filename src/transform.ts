import type { StackFrame } from 'stacktrace-parser'

import { type NullableMappedPosition } from 'source-map'

import type { SourceMap } from './SourceMap.ts'
import type { StackTrace } from './StackTrace.ts'

export function transform(stackTrace: StackTrace, bindings: Record<string, SourceMap>) {
  const result = [stackTrace.message || '']

  const transformed = stackTrace.frames.map(stackFrame =>
    generateStackTraceLine(
      toUnifiedPosition(tryGetOriginalPosition(stackFrame, bindings) || stackFrame),
    ),
  )

  return result.concat(transformed).join('\n')
}

function tryGetOriginalPosition(
  stackFrame: StackFrame,
  bindings: Record<string, SourceMap>,
): NullableMappedPosition | null {
  let result: NullableMappedPosition | null = null

  const { column, file, line } = toUnifiedPosition(stackFrame)

  if (!file || !bindings[file] || !line || !column) {
    return null
  }

  result = bindings[file].consumer.originalPositionFor({ column, line })

  return result
}

function generateStackTraceLine(position: UnifiedPosition) {
  const { column, file, line, method } = position
  return `  at${method ? ` ${method}` : ''} (${file}:${line}:${column})`
}

function toUnifiedPosition(position: NullableMappedPosition | StackFrame): UnifiedPosition {
  if (isStackFrame(position)) {
    return {
      column: position.column,
      file: position.file,
      line: position.lineNumber,
      method: position.methodName,
    }
  } else if (isNullableMappedPosition(position)) {
    return {
      column: position.column,
      file: position.source,
      line: position.line,
      method: position.name,
    }
  } else {
    throw new Error('Unknown position type')
  }
}

function isStackFrame(position: NullableMappedPosition | StackFrame): position is StackFrame {
  return 'lineNumber' in position
}

function isNullableMappedPosition(
  position: NullableMappedPosition | StackFrame,
): position is NullableMappedPosition {
  return 'source' in position
}

type UnifiedPosition = {
  column: null | number
  file: null | string
  line: null | number
  method: null | string
}
