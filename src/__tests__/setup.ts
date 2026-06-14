import '@testing-library/jest-dom'
import { vi } from 'vitest'

mockPrefersColorScheme(false)

export function mockPrefersColorScheme(prefersDark: boolean) {
  const matchMediaMock = vi.fn().mockImplementation(query => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: prefersDark,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('matchMedia', matchMediaMock)
}
