import { SourceMapConsumer } from 'source-map'
import { describe, expect, test, vi } from 'vitest'

describe('entry point', () => {
  test('initializes the source map consumer with the locally bundled wasm file', async () => {
    const container = document.createElement('div')
    container.id = 'root'
    document.body.appendChild(container)

    const initializeSpy = vi.spyOn(
      SourceMapConsumer as unknown as { initialize: (options: Record<string, string>) => void },
      'initialize',
    )

    await import('../main.tsx')

    expect(initializeSpy).toHaveBeenCalledOnce()

    const wasmUrl = initializeSpy.mock.calls[0][0]['lib/mappings.wasm']
    expect(wasmUrl).toMatch(/mappings\.wasm$/)
    expect(wasmUrl).not.toMatch(/^https?:/)
  })
})
