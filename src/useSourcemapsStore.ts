import { useState } from 'react'

import { SourceMap } from './SourceMap.ts'

export function useSourcemapsStore() {
  const [sourceMaps, setSourceMaps] = useState<SourceMap[]>([])

  function addSourceMaps(value: (null | SourceMap)[] | SourceMap) {
    const newSourceMaps: SourceMap[] = []

    for (const sourceMap of Array.isArray(value) ? value : [value]) {
      if (sourceMap && !sourceMaps.some(s => s.isEqual(sourceMap))) {
        newSourceMaps.push(sourceMap)
      }
    }

    setSourceMaps(sourceMaps => [...sourceMaps, ...newSourceMaps])
  }

  function deleteSourceMap(id: number) {
    const index = sourceMaps.findIndex(sm => sm.id === id)
    const sm = sourceMaps[index]
    sm.consumer.destroy()
    setSourceMaps(sourceMaps => sourceMaps.filter((_sm, i) => i !== index))
  }

  return { addSourceMaps, deleteSourceMap, sourceMaps }
}
