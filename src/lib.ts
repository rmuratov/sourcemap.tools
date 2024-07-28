import type { StackFrame } from 'stacktrace-parser'

import { type NullableMappedPosition } from 'source-map'

import type { SourceMap } from './SourceMap.ts'
import type { StackTrace } from './StackTrace.ts'

export function transform(sourceMaps: SourceMap[], stackTrace: null | StackTrace) {
  const bindings = calculateBindings(sourceMaps, stackTrace)

  if (!stackTrace || Object.keys(bindings).length === 0) {
    return ''
  }

  const result = [stackTrace.message]

  const transformed = stackTrace.frames.map(stackFrame =>
    generateStackTraceLine(
      toUnifiedPosition(tryGetOriginalPosition(stackFrame, bindings) ?? stackFrame),
    ),
  )

  return result.concat(transformed).join('\n')
}

function tryGetOriginalPosition(
  stackFrame: StackFrame,
  bindings: Record<string, SourceMap>,
): null | NullableMappedPosition {
  let result: null | NullableMappedPosition = null

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
  }

  return {
    column: position.column,
    file: position.source,
    line: position.line,
    method: position.name,
  }
}

function isStackFrame(position: NullableMappedPosition | StackFrame): position is StackFrame {
  return 'lineNumber' in position
}

interface UnifiedPosition {
  column: null | number
  file: null | string
  line: null | number
  method: null | string
}

function calculateBindings(sourceMaps: SourceMap[], stackTrace: null | StackTrace) {
  if (!stackTrace || stackTrace.fileNames.length === 0 || sourceMaps.length === 0) {
    return {}
  }

  const bindings: Record<string, SourceMap> = {}

  for (const fileName of stackTrace.fileNames) {
    for (const sourceMap of sourceMaps) {
      if (fileName === sourceMap.fileNameInline || fileName === sourceMap.fileName) {
        bindings[fileName] = sourceMap
      }
    }
  }

  return bindings
}
