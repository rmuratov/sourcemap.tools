import { useState } from 'react'

import { SourceMap } from './source-map.ts'

export function useSourcemapsStore() {
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([])

  // Deduplication and consumer destruction happen outside the state updaters:
  // updaters must be pure, StrictMode invokes them twice.
  function addSourceMaps(value: (null | SourceMap)[] | SourceMap) {
    const candidates = (Array.isArray(value) ? value : [value]).filter(
      (sm): sm is SourceMap => sm !== null,
    )

    const toAdd: SourceMap[] = []

    for (const candidate of candidates) {
      if ([...sourceMaps, ...toAdd].some(sm => sm.isEqual(candidate))) {
        candidate.consumer.destroy()
      } else {
        toAdd.push(candidate)
      }
    }

    if (toAdd.length) {
      setSourceMaps(prev => [...prev, ...toAdd])
    }
  }

  function deleteSourceMap(id: number) {
    const target = sourceMaps.find(sm => sm.id === id)

    if (!target) {
      return
    }

    target.consumer.destroy()
    setSourceMaps(prev => prev.filter(sm => sm.id !== id))
  }

  return { addSourceMaps, deleteSourceMap, sourceMaps }
}
