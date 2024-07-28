import type {
  BasicSourceMapConsumer,
  IndexedSourceMapConsumer,
  RawIndexMap,
  RawSourceMap,
} from 'source-map'

import { SourceMapConsumer } from 'source-map'

let id = 0

export class SourceMap {
  consumer: BasicSourceMapConsumer | IndexedSourceMapConsumer
  fileName?: string
  fileNameInline?: string
  id: number

  constructor(
    consumer: BasicSourceMapConsumer | IndexedSourceMapConsumer,
    fileNameInline?: string,
    fileName?: string,
  ) {
    this.id = id++
    this.consumer = consumer
    this.fileNameInline = fileNameInline
    this.fileName = fileName
  }

  static async create(rawSourceMap: string, sourceMapFileName?: string) {
    let parsed: null | RawIndexMap | RawSourceMap
    try {
      parsed = JSON.parse(rawSourceMap)
    } catch {
      parsed = null
    }

    if (!parsed || !SourceMap.isRawSourceMap(parsed)) {
      return null
    }

    const consumer = await new SourceMapConsumer(rawSourceMap)
    const fileNameInline = parsed.file

    return new SourceMap(consumer, fileNameInline, sourceMapFileName)
  }

  static isRawSourceMap(sourceMap: RawIndexMap | RawSourceMap): sourceMap is RawSourceMap {
    return (
      'version' in sourceMap &&
      'sources' in sourceMap &&
      'names' in sourceMap &&
      'mappings' in sourceMap
    )
  }

  isEqual(sourceMap: SourceMap) {
    return this.fileNameInline === sourceMap.fileNameInline
  }
}
