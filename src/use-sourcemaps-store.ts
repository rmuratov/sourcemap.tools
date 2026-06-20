import { useState } from 'react'

import { SourceMap } from './source-map.ts'

export function useSourcemapsStore() {
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([])

  function addSourceMaps(value: (null | SourceMap)[] | SourceMap) {
    const candidates = (Array.isArray(value) ? value : [value]).filter(
      (sm): sm is SourceMap => sm !== null,
    )
    setSourceMaps(prev => {
      const toAdd = candidates.filter(sm => !prev.some(s => s.isEqual(sm)))
      return toAdd.length ? [...prev, ...toAdd] : prev
    })
  }

  function deleteSourceMap(id: number) {
    setSourceMaps(prev => {
      const target = prev.find(sm => sm.id === id)
      if (!target) return prev
      target.consumer.destroy()
      return prev.filter(sm => sm.id !== id)
    })
  }

  return { addSourceMaps, deleteSourceMap, sourceMaps }
}
