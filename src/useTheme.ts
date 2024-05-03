import { useSyncExternalStore } from 'react'

import type { Theme } from './types'

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme)
  window.dispatchEvent(new Event('storage'))
}

export function useTheme(): Theme {
  const themeFromLocalStorage = useThemeFromLocalStorage()
  const themeFromMediaQuery = useThemeFromMediaQuery()

  return themeFromLocalStorage ?? themeFromMediaQuery
}

function useThemeFromLocalStorage(): null | Theme {
  return useSyncExternalStore<null | Theme>(
    themeFromLocalStorageSubscribe,
    themeFromLocalStorageGetSnapshot,
  )
}

function themeFromLocalStorageGetSnapshot(): null | Theme {
  return localStorage.getItem('theme') as null | Theme
}

function themeFromLocalStorageSubscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
  }
}

function useThemeFromMediaQuery() {
  return useSyncExternalStore(themeFromMediaQuerySubscribe, themeFromMediaQueryGetSnapshot)
}

function themeFromMediaQueryGetSnapshot() {
  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
  return mediaQueryList.matches ? 'dark' : 'light'
}

function themeFromMediaQuerySubscribe(onStoreChange: () => void) {
  const mediaQuery = '(prefers-color-scheme: dark)'
  window.matchMedia(mediaQuery).addEventListener('change', onStoreChange)
  return () => {
    window.matchMedia(mediaQuery).removeEventListener('change', onStoreChange)
  }
}
