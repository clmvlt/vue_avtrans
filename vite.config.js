import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2'
import path from 'path'
import fs from 'fs'

// Plugin pour générer version.json au build
const versionPlugin = () => {
  return {
    name: 'version-generator',
    writeBundle(options) {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
      const versionInfo = {
        version: packageJson.version,
        buildTime: new Date().toISOString()
      }
      const outDir = options.dir || 'dist'
      fs.writeFileSync(
        path.join(outDir, 'version.json'),
        JSON.stringify(versionInfo, null, 2)
      )
      console.log(`✓ version.json generated (v${packageJson.version})`)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
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
