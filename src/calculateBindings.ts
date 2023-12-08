import type { SourceMap } from './SourceMap.ts'
import type { StackTrace } from './StackTrace.ts'

export function calculateBindings(sourceMaps: SourceMap[], stackTrace: StackTrace | null) {
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
