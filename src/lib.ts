import type { StackFrame } from 'stacktrace-parser'

import { type NullableMappedPosition } from 'source-map'

import type { SourceMap } from './source-map.ts'
import type { StackTrace } from './stack-trace.ts'

export function transform(sourceMaps: SourceMap[], stackTrace: null | StackTrace) {
  if (!stackTrace) {
    return ''
  }

  const bindings = calculateBindings(sourceMaps, stackTrace)
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
): null | OriginalPosition {
  const { column, file, line } = toUnifiedPosition(stackFrame)

  if (!file || !bindings[file] || line == null || line < 1 || column == null) {
    return null
  }

  // Stack traces use 1-based columns, the source-map library expects 0-based.
  const result = bindings[file].consumer.originalPositionFor({
    column: Math.max(column - 1, 0),
    line,
  })

  return isResolvedPosition(result) ? result : null
}

interface OriginalPosition {
  column: number
  line: number
  name: null | string
  source: string
}

// A found mapping always carries line and column along with the source.
function isResolvedPosition(
  position: NullableMappedPosition,
): position is NullableMappedPosition & OriginalPosition {
  return position.source != null
}

function generateStackTraceLine(position: UnifiedPosition) {
  const { column, file, line, method } = position
  return `  at${method ? ` ${method}` : ''} (${file}:${line}:${column})`
}

function toUnifiedPosition(position: OriginalPosition | StackFrame): UnifiedPosition {
  if (isStackFrame(position)) {
    return {
      column: position.column,
      file: position.file,
      line: position.lineNumber,
      method: position.methodName === '<unknown>' ? null : position.methodName,
    }
  }

  return {
    // The source-map library returns 0-based columns, stack traces use 1-based.
    column: position.column + 1,
    file: position.source,
    line: position.line,
    method: position.name,
  }
}

function isStackFrame(position: OriginalPosition | StackFrame): position is StackFrame {
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

  // TODO: Cover filenames manipulations with tests
  for (const fileName of stackTrace.fileNames) {
    const maybeFileNameFromPath = extractFileNameFromPath(fileName)
    for (const sourceMap of sourceMaps) {
      const cleanedSourceMapFileNameInline = cleanSourceMapFileName(sourceMap.fileNameInline)
      const cleanedSourceMapFileName = cleanSourceMapFileName(sourceMap.fileName)
      if (
        fileName === cleanedSourceMapFileNameInline ||
        fileName === cleanedSourceMapFileName ||
        maybeFileNameFromPath === cleanedSourceMapFileNameInline ||
        maybeFileNameFromPath === cleanedSourceMapFileName
      ) {
        bindings[fileName] = sourceMap
      }
    }
  }

  return bindings
}

function extractFileNameFromPath(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1]
}

function cleanSourceMapFileName(fileName?: string) {
  return fileName?.replace(/\.map$/, '')
}
