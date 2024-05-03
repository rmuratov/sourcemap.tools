import type { ChangeEvent } from 'react'

import type { Theme } from './types'

export function ThemeToggle({
  onChange,
  theme,
}: {
  onChange: (value: Theme) => void
  theme: Theme
}) {
  const isDarkTheme = theme === 'dark'

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.checked ? 'dark' : 'light')

  return (
    <label className="grid cursor-pointer place-items-center">
      <input
        aria-label="Toggle theme"
        checked={isDarkTheme}
        className="toggle theme-controller bg-base-content col-span-2 col-start-1 row-start-1"
        name="toggleTheme"
        onChange={onInputChange}
        type="checkbox"
      />
      <svg
        className="stroke-base-100 fill-base-100 col-start-1 row-start-1"
        fill="none"
        height="14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
      <svg
        className="stroke-base-100 fill-base-100 col-start-2 row-start-1"
        fill="none"
        height="14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </label>
  )
}
