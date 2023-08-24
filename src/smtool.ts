import { RawIndexMap, RawSourceMap, SourceMapConsumer } from 'source-map'
import * as stackTraceParser from 'stacktrace-parser'
import { StackFrame } from 'stacktrace-parser'

export async function transform(
  stackTrace: string,
  maps: Record<string, RawIndexMap | RawSourceMap | string>,
) {
  const stack = stackTraceParser.parse(stackTrace)
  const errorMessage = stackTrace.split('\n')[0]
  const newStack = [errorMessage]
  const transformed = await Promise.all(stack.map(sf => processStackFrame(sf, maps)))
  const result = newStack.concat(transformed).join('\n')
  return result
}

async function processStackFrame(
  stackFrame: StackFrame,
  maps: Record<string, RawIndexMap | RawSourceMap | string>,
) {
  let result = ''
  if (stackFrame.file && maps[stackFrame.file]) {
    await SourceMapConsumer.with(maps[stackFrame.file], null, consumer => {
      if (stackFrame.column && stackFrame.lineNumber) {
        const originalPosition = consumer.originalPositionFor({
          column: stackFrame.column,
          line: stackFrame.lineNumber,
        })

        result = `\tat ${originalPosition.name || '<unknown>'} (${originalPosition.source}:${
          originalPosition.line
        }:${originalPosition.column})`
      }
    })
  } else {
    result = `\tat ${stackFrame.methodName || '<unknown>'} (${stackFrame.file}:${
      stackFrame.lineNumber
    }:${stackFrame.column})`
  }

  return result
}
