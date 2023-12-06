import type { StackTrace } from './StackTrace.ts'

import { SourceMap } from './SourceMap.ts'

export function calcBindings(sourceMaps: SourceMap[], stackTrace?: StackTrace) {
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
