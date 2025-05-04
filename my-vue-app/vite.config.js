import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://hiagent.volcenginepaas.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/api/proxy') // 保持路径不变
      }
    }
  }
})
