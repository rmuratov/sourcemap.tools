import { render } from '@testing-library/react'
import * as sourceMap from 'source-map'

import App from './App.tsx'

describe('general', () => {
  test('renders', () => {
    window.sourceMap = sourceMap
    render(<App />)

    console.log(window.screen)
  })
})
