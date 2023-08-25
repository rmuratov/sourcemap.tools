import { NullableMappedPosition, RawIndexMap, RawSourceMap, SourceMapConsumer } from 'source-map'
import * as stackTraceParser from 'stacktrace-parser'
import { StackFrame } from 'stacktrace-parser'

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

export function parse(stackTrace: string) {
  const parsed = parseStackTrace(stackTrace)

  const files: Set<string> = new Set()

  parsed.frames.forEach(f => f.file && files.add(f.file))

  return {
    files: Array.from(files),
  }
}

function parseStackTrace(stackTrace: string): { frames: StackFrame[]; message: string } {
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

function isStackFrame(position: object): position is StackFrame {
  return Boolean((position as StackFrame).lineNumber)
}

function isNullableMappedPosition(position: object): position is NullableMappedPosition {
  return Boolean((position as NullableMappedPosition).source)
}

export function createConsumer(rawSourceMap: string) {
  return new SourceMapConsumer(rawSourceMap)
}
