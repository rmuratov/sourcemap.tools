import { strFromU8, unzip } from 'fflate'

export interface ExtractedFile {
  name: string
  text: string
}

const MAX_ENTRIES = 5000
const MAX_TOTAL_SIZE = 500 * 1024 * 1024
const mapFileRegex = /\.(?:json|map|txt)$/i

export function isZipFile(file: File) {
  return /\.zip$/i.test(file.name) || file.type === 'application/zip'
}

// Rejects when the archive is invalid or exceeds the size/entry limits.
export async function extractSourceMapFiles(file: File): Promise<ExtractedFile[]> {
  const data = new Uint8Array(await file.arrayBuffer())

  let entries = 0
  let totalSize = 0

  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(
      data,
      {
        filter: info => {
          if (info.name.endsWith('/') || !mapFileRegex.test(info.name)) {
            return false
          }

          const segments = info.name.split('/')
          if (segments[0] === '__MACOSX' || segments[segments.length - 1].startsWith('.')) {
            return false
          }

          entries++
          totalSize += info.originalSize
          if (entries > MAX_ENTRIES || totalSize > MAX_TOTAL_SIZE) {
            throw new Error('Archive too large')
          }

          return true
        },
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    )
  })

  return Object.entries(unzipped).map(([name, bytes]) => ({ name, text: strFromU8(bytes) }))
}
