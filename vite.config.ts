import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (development, production, etc.)
  // O terceiro argumento '' diz para carregar todas as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Isso substitui todas as ocorrências de 'process.env.API_KEY' no código 
      // pelo valor real da chave que está no seu arquivo .env ou nas configurações da Vercel
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})