import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.cwd())
const port = Number(process.env.PORT || 4173)

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml'
}

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const requestedPath =
    url.pathname === '/'
      ? 'index.html'
      : normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '').replace(/^(\.\.[/\\])+/, '')
  const filePath = resolve(join(root, requestedPath))

  if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Not found')
    return
  }

  const stat = statSync(filePath)
  const contentType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
  const range = request.headers.range
  if (range) {
    const parsed = parseRange(range, stat.size)
    if (!parsed) {
      response.writeHead(416, {
        'accept-ranges': 'bytes',
        'content-range': `bytes */${stat.size}`,
        'content-type': contentType
      })
      response.end()
      return
    }

    response.writeHead(206, {
      'accept-ranges': 'bytes',
      'content-length': parsed.end - parsed.start + 1,
      'content-range': `bytes ${parsed.start}-${parsed.end}/${stat.size}`,
      'content-type': contentType
    })
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(filePath, { start: parsed.start, end: parsed.end }).pipe(response)
    return
  }

  response.writeHead(200, {
    'accept-ranges': 'bytes',
    'content-length': stat.size,
    'content-type': contentType
  })
  if (request.method === 'HEAD') {
    response.end()
    return
  }
  createReadStream(filePath).pipe(response)
}).listen(port, '127.0.0.1', () => {
  console.log(`TikCanvas demo: http://127.0.0.1:${port}`)
})

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim())
  if (!match) return null

  let start
  let end
  if (match[1] === '') {
    const suffixLength = Number(match[2])
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null
    start = Math.max(0, size - suffixLength)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? size - 1 : Number(match[2])
  }

  if (!Number.isInteger(start) || !Number.isInteger(end)) return null
  if (start < 0 || end < start || start >= size) return null
  return { start, end: Math.min(end, size - 1) }
}
