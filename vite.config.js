import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/monitor': {
        //target: 'http://172.21.212.165:8700/',
        target: 'http://223.2.36.49:8700/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/monitor/, '')
      },
    }
  }
})
