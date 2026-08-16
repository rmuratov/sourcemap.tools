/// <reference types="vitest" />
import type { Plugin } from 'vite'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import Sitemap from 'vite-plugin-sitemap'

import { SIMPLE_ANALYTICS } from './src/analytics/vendor.ts'

// Queues events fired before the async script has loaded.
// https://docs.simpleanalytics.com/events
const simpleAnalyticsStub =
  'window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};'

// Injects the Simple Analytics snippet, but only into builds that opted in
// through VITE_ANALYTICS. Forks build without it and ship no analytics at all.
function simpleAnalytics(enabled: boolean): Plugin {
  return {
    name: 'simple-analytics',

    transformIndexHtml() {
      if (!enabled) {
        return []
      }

      return [
        { children: simpleAnalyticsStub, injectTo: 'head' as const, tag: 'script' },
        {
          attrs: {
            async: true,
            defer: true,
            src: 'https://scripts.simpleanalyticscdn.com/latest.js',
          },
          injectTo: 'body' as const,
          tag: 'script',
        },
        {
          children:
            '<img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerpolicy="no-referrer-when-downgrade" />',
          injectTo: 'body' as const,
          tag: 'noscript',
        },
      ]
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_ANALYTICS } = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    build: {
      sourcemap: true,
    },
    plugins: [
      react(),
      Sitemap({ hostname: 'https://sourcemap.tools' }),
      simpleAnalytics(VITE_ANALYTICS === SIMPLE_ANALYTICS),
    ],

    test: {
      // you might want to disable it, if you don't have tests that rely on CSS
      // since parsing CSS is slow
      css: true,
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/__tests__/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json'],
        include: ['src/**/*.{ts,tsx}'],
        thresholds: { 100: true },
      },
    },
  }
})
