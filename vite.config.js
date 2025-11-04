import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  root: '.', // directory principale del progetto
  publicDir: 'public', // dove si trovano favicon, robots.txt, ecc.
  build: {
    outDir: 'dist', // cartella di output
    assetsDir: 'assets', // sottocartella per i file generati (solo se serve)
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  plugins: [
    {
      name: 'copy-headers',
      closeBundle() {
        try {
          mkdirSync(resolve(__dirname, 'dist'), { recursive: true })
          copyFileSync(
            resolve(__dirname, 'public/_headers'),
            resolve(__dirname, 'dist/_headers')
          )
          console.log('✅ Copiato file _headers')
        } catch (err) {
          console.error('❌ Errore nel copiare _headers:', err)
        }
      }
    }
  ]
})
