import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Mock API plugin for development
    {
      name: 'mock-api',
      configureServer(server) {
        // Mock /api/config for local development
        server.middlewares.use('/api/config', (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({}))
        })
        server.middlewares.use('/api/parse-chat', (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: '로컬 개발 환경에서는 링크 파싱이 지원되지 않습니다. Vercel에 배포하면 사용 가능합니다.',
            hint: '지금은 "직접 붙여넣기" 탭을 이용해주세요.'
          }))
        })
      }
    }
  ],
})
