import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import { defineManifest } from '@crxjs/vite-plugin'
import { Buffer } from 'buffer'
import process from 'process'

// Polyfill ReadableStream
if (typeof globalThis.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web')
  globalThis.ReadableStream = ReadableStream
}

const manifest = defineManifest({
  manifest_version: 3,
  name: "Voice Navigation Assistant",
  version: "1.0.0",
  description: "Navigate websites using voice commands with OpenAI's Realtime API",
  permissions: [
    "activeTab",
    "scripting",
    "storage",
    "tabs"
  ],
  host_permissions: [
    "https://api.openai.com/*"
  ],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https://api.openai.com ws://localhost:* http://localhost:*;"
  },
  action: {
    default_popup: "src/popup.html",
    default_icon: {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  icons: {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  options_page: "src/options.html",
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content.ts"]
    }
  ]
})

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  define: {
    'process.env': process.env,
    'global': {},
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  }
})
