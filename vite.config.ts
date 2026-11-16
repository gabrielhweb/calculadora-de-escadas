import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Só para rodar no computador (npm run dev): o código ainda lê process.env em alguns
// lugares e, sem isso, a página fica branca ("process is not defined").
// O build da Vercel (npm run build) não é afetado.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: command === 'serve' ? { 'process.env': '{}' } : {},
}))
