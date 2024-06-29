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

function useThemeFromLocalStorage(): Theme | null {
  return useSyncExternalStore<Theme | null>(
    themeFromLocalStorageSubscribe,
    themeFromLocalStorageGetSnapshot,
  )
}

function themeFromLocalStorageGetSnapshot(): Theme | null {
  return localStorage.getItem('theme') as Theme | null
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
