# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sourcemap.tools is a React-based web application that transforms minified JavaScript stack traces into readable format using source maps. The application runs entirely client-side without fetching external resources.

## Development Commands

- `npm run dev` - Start development server (Vite) on http://localhost:5173/
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint with zero warnings policy
- `npm run ts` - Run TypeScript compiler check
- `npm run prettier` - Check code formatting
- `npm test` - Run tests with Vitest
- `npm run coverage` - Run tests with coverage report
- `npm run preview` - Preview production build locally

## Architecture

### Core Components

- **App.tsx** - Main application component handling stack trace input, source map management, and UI layout
- **SourceMap.ts** - Class wrapper around Mozilla's source-map library for parsing and consuming source maps
- **StackTrace.ts** - Parser for JavaScript stack traces to extract file names and line/column numbers
- **useSourcemapsStore.ts** - React hook for managing source map state (add, delete, deduplication)
- **lib.ts** - Core transformation logic that applies source maps to stack traces

### Key Features

- **Client-side Processing** - All source map transformations happen in the browser
- **Multiple Input Methods** - Support for file upload and text paste for source maps
- **Deduplication** - Prevents adding duplicate source maps based on inline filenames
- **Memory Management** - Properly destroys source map consumers to prevent memory leaks

### Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS + DaisyUI** for styling with dark mode support
- **Vitest** for testing with jsdom environment
- **ESLint 9** with strict configuration (zero warnings policy)
- **Mozilla source-map** library for source map consumption

### Testing Setup

- Tests located in `src/__tests__/`
- Vitest configuration in `vite.config.ts`
- Setup file at `src/__tests__/setup.ts`
- Test fixtures in `src/__tests__/fixtures/`

### Build Configuration

- Source maps enabled in production builds
- Sitemap generation for SEO
- Static site generation optimized for deployment