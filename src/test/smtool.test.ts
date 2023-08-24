import { transform } from '../smtool.ts'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import stackTrace from './mocks/stacktrace'
import { expect } from 'vitest'

const indexMap = readFileSync(
  resolve(__dirname, 'mocks/sourcemaps/index-d803759c.js.map'),
).toString()
const vendorMap = readFileSync(
  resolve(__dirname, 'mocks/sourcemaps/vendor-221d27ba.js.map'),
).toString()

describe('transform', () => {
  test('transforms', async () => {
    expect(
      await transform(stackTrace, {
        'index-d803759c.js': indexMap,
        'vendor-221d27ba.js': vendorMap,
      }),
    ).toMatchSnapshot()
  })
})
