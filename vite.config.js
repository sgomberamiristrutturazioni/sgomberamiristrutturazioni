import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    {
      name: 'copy-headers',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'public/_headers'),
            resolve(__dirname, 'dist/_headers')
          )
          console.log('✓ Copied _headers file')
        } catch (err) {
          console.error('Failed to copy _headers:', err)
        }
      },
    },
  ],
})
