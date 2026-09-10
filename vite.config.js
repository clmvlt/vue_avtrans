import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// Version unique de l'application : package.json fait foi (incrémenté par deploy/deploy.py).
// Elle est injectée dans le bundle (__APP_VERSION__, voir src/config/version.ts) et écrite
// dans dist/version.json ; le client compare les deux pour détecter un redéploiement.
const APP_VERSION = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')).version

const gitCommit = () => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

// Génère dist/version.json à la fin du build. Ce fichier doit être servi sans cache
// (voir deploy/apache-cache-headers.conf).
const versionPlugin = () => ({
  name: 'version-generator',
  apply: 'build',
  writeBundle(options) {
    const outDir = options.dir || path.resolve(__dirname, 'dist')
    const versionInfo = {
      version: APP_VERSION,
      buildTime: new Date().toISOString(),
      commit: gitCommit()
    }
    fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify(versionInfo, null, 2) + '\n')
    console.log(`✓ version.json generated (v${APP_VERSION})`)
  }
})

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION)
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    versionPlugin(),
    // Pré-compression des assets au build (gzip + brotli)
    compression({ algorithm: 'gzip', exclude: [/\.(br)$/] }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(gz)$/] })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue core - loaded on all pages
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Font Awesome - loaded on all pages (optimized: ~75 icons instead of ~7000)
          'fontawesome': ['@fortawesome/fontawesome-svg-core', '@fortawesome/vue-fontawesome'],
          // Chart.js - lazy loaded (only VehiculeDetail, Entretiens pages)
          'chartjs': ['chart.js', 'vue-chartjs'],
          // PDF.js - lazy loaded (only AVPdfPreview component)
          'pdfjs': ['pdfjs-dist'],
          // Three.js - lazy loaded (only Landing FleetViewer)
          'threejs': ['three', '@tresjs/core', '@tresjs/cientos'],
          // Mapbox GL - lazy loaded (only UserServices map modal)
          'mapbox': ['mapbox-gl']
        }
      }
    }
  }
})
