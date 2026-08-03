import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // プレビュー環境がポートを割り当てる場合(PORT env)はそれに従う
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
})
