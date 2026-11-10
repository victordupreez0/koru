import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Python runtime (Pyodide) is several large files that must be fetched as they are,
// not bundled. Serving them from our own origin means "Run" works without an internet connection.
const PYODIDE_FILES = {
  'pyodide.mjs': 'text/javascript',
  'pyodide.asm.js': 'text/javascript',
  'pyodide.asm.wasm': 'application/wasm',
  'python_stdlib.zip': 'application/zip',
  'pyodide-lock.json': 'application/json',
}
const pyodideDir = path.resolve(import.meta.dirname, 'node_modules/pyodide')

const servePyodide = {
  name: 'koru-pyodide-dev',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/pyodide', (req, res, next) => {
      const name = path.basename((req.url || '').split('?')[0])
      if (!PYODIDE_FILES[name]) return next()
      res.setHeader('Content-Type', PYODIDE_FILES[name])
      res.setHeader('Cache-Control', 'public, max-age=86400')
      fs.createReadStream(path.join(pyodideDir, name)).pipe(res)
    })
  },
}

const copyPyodide = {
  name: 'koru-pyodide-build',
  apply: 'build',
  closeBundle() {
    const out = path.resolve(import.meta.dirname, 'dist/pyodide')
    fs.mkdirSync(out, { recursive: true })
    for (const name of Object.keys(PYODIDE_FILES)) fs.copyFileSync(path.join(pyodideDir, name), path.join(out, name))
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), servePyodide, copyPyodide],
  base: './',
  server: {
    port: 5200,
  },
  worker: { format: 'es' },
  // Excalidraw is only imported when a drawing is opened. Pre-bundling it here stops
  // the dev server pausing to bundle it the first time someone clicks a drawing.
  optimizeDeps: {
    include: ['@excalidraw/excalidraw'],
  },
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
})
