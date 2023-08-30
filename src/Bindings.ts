import type { SourceMap } from './SourceMap.ts'

export class Bindings {
  bindings: Map<string, SourceMap> = new Map<string, SourceMap>()
  fileNames: Set<string> = new Set<string>()
  sourceMaps: Set<SourceMap> = new Set<SourceMap>()

  addFileName(fileName: string) {
    this.fileNames.add(fileName)

    if (!this.bindings.has(fileName)) {
      for (const sourceMap of this.sourceMaps) {
        if (fileName === sourceMap.fileNameInline || fileName === sourceMap.fileName) {
          this.bindings.set(fileName, sourceMap)
        }
      }
    }
  }

  addFileNames(fileNames: string[]) {
    for (const fileName of fileNames) {
      this.addFileName(fileName)
    }
  }

  addSourceMap(sourceMap: SourceMap) {
    this.sourceMaps.add(sourceMap)

    for (const fileName of this.fileNames) {
      if (
        !this.bindings.has(fileName) &&
        (fileName === sourceMap.fileNameInline || fileName === sourceMap.fileName)
      ) {
        this.bindings.set(fileName, sourceMap)
      }
    }
  }

  addSourceMaps(sourceMaps: SourceMap[]) {
    for (const sourceMap of sourceMaps) {
      this.addSourceMap(sourceMap)
    }
  }

  bind(fileName: string, sourceMap: SourceMap) {
    if (!this.fileNames.has(fileName)) {
      throw new Error(`No such file: ${fileName}`)
    }

    if (!this.sourceMaps.has(sourceMap)) {
      throw new Error(`No such sourcemap: ${sourceMap.id}`)
    }

    this.bindings.set(fileName, sourceMap)
  }

  removeFileName(fileName: string) {
    this.unbind(fileName)
    this.fileNames.delete(fileName)
  }

  removeSourceMap(sourceMap: SourceMap) {
    for (const fileName of this.fileNames) {
      if (this.bindings.get(fileName) === sourceMap) {
        this.unbind(fileName)
      }
    }

    this.sourceMaps.delete(sourceMap)
  }

  unbind(fileName: string) {
    this.bindings.delete(fileName)
  }
}
