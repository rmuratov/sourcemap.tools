import type {
  BasicSourceMapConsumer,
  IndexedSourceMapConsumer,
  RawIndexMap,
  RawSourceMap,
} from 'source-map'

import { nanoid } from 'nanoid'
import { SourceMapConsumer } from 'source-map'

export class SourceMap {
  consumer: BasicSourceMapConsumer | IndexedSourceMapConsumer
  fileName?: string
  fileNameInline?: string
  id: string

  constructor(
    consumer: BasicSourceMapConsumer | IndexedSourceMapConsumer,
    fileNameInline?: string,
    fileName?: string,
  ) {
    this.id = nanoid()
    this.consumer = consumer
    this.fileNameInline = fileNameInline
    this.fileName = fileName
  }

  static async create(rawSourceMap: string, sourceMapFileName?: string) {
    let parsed: RawIndexMap | RawSourceMap | null
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
