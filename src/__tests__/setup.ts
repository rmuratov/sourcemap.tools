import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

mockPrefersColorScheme(false)

export function mockPrefersColorScheme(prefersDark: boolean) {
  const matchMediaMock = vi.fn(query => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: prefersDark,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('matchMedia', matchMediaMock)
}
