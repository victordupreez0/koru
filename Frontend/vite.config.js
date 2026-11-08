import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    port: 5200,
  },
  // Excalidraw is only imported when a drawing is opened. Pre-bundling it here stops
  // the dev server pausing to bundle it the first time someone clicks a drawing.
  optimizeDeps: {
    include: ['@excalidraw/excalidraw'],
  },
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
})
