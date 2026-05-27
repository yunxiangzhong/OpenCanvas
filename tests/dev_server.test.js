import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

const TEST_PORT = 4185

test('dev server serves byte ranges for videos', async () => {
  const server = await startServer(TEST_PORT)
  try {
    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/videos/video-1.mp4`, {
      headers: { range: 'bytes=0-1023' }
    })

    assert.equal(response.status, 206)
    assert.equal(response.headers.get('accept-ranges'), 'bytes')
    assert.match(response.headers.get('content-range'), /^bytes 0-1023\/\d+$/)
    assert.equal(response.headers.get('content-length'), '1024')
    assert.equal((await response.arrayBuffer()).byteLength, 1024)
  } finally {
    server.kill()
  }
})

test('dev server rejects unsatisfiable byte ranges', async () => {
  const server = await startServer(TEST_PORT + 1)
  try {
    const response = await fetch(`http://127.0.0.1:${TEST_PORT + 1}/videos/video-1.mp4`, {
      headers: { range: 'bytes=999999999-1000000000' }
    })

    assert.equal(response.status, 416)
    assert.equal(response.headers.get('accept-ranges'), 'bytes')
    assert.match(response.headers.get('content-range'), /^bytes \*\/\d+$/)
  } finally {
    server.kill()
  }
})

function startServer(port) {
  const child = spawn(process.execPath, ['scripts/dev-server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error(`dev server did not start: ${stderr}`))
    }, 5000)

    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes(`http://127.0.0.1:${port}`)) {
        clearTimeout(timeout)
        resolve(child)
      }
    })

    child.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`dev server exited with ${code}: ${stderr}`))
    })
  })
}
