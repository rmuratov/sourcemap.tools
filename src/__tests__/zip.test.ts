import { strToU8, zipSync } from 'fflate'
import { describe, expect, test } from 'vitest'

import { extractSourceMapFiles, isZipFile } from '../zip.ts'
import { regular } from './fixtures'

function makeZip(files: Record<string, string>) {
  const data: Record<string, Uint8Array> = {}
  for (const [name, content] of Object.entries(files)) {
    data[name] = strToU8(content)
  }
  // Copy into a plain ArrayBuffer-backed array for the File constructor.
  return new File([new Uint8Array(zipSync(data))], 'maps.zip')
}

describe('zip', () => {
  test('extracts source maps from nested folders and skips other files', async () => {
    const [a, b] = regular.sourcemaps
    const file = makeZip({
      '__MACOSX/dist/._a.map': 'junk',
      'dist/assets/a.js.map': a.content,
      'dist/b.js.map': b.content,
      'dist/index.js': 'console.log(1)',
    })

    const result = await extractSourceMapFiles(file)

    expect(result.map(r => r.name).sort()).toEqual(['dist/assets/a.js.map', 'dist/b.js.map'])
    expect(result.find(r => r.name === 'dist/b.js.map')?.text).toBe(b.content)
  })

  test('rejects an invalid archive', async () => {
    await expect(extractSourceMapFiles(new File(['not a zip'], 'x.zip'))).rejects.toBeDefined()
  })

  test('rejects archives with too many files', async () => {
    const files = Object.fromEntries(
      Array.from({ length: 5001 }, (_, index) => [`maps/${index}.map`, '']),
    )

    await expect(extractSourceMapFiles(makeZip(files))).rejects.toThrow('Archive too large')
  })

  test('detects zip files', () => {
    expect(isZipFile(new File([], 'a.ZIP'))).toBe(true)
    expect(isZipFile(new File([], 'a.map'))).toBe(false)
  })
})
