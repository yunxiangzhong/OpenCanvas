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

  response.writeHead(200, {
    'content-type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
  })
  createReadStream(filePath).pipe(response)
}).listen(port, '127.0.0.1', () => {
  console.log(`TikCanvas demo: http://127.0.0.1:${port}`)
})
