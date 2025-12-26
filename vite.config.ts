
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env (local)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Tenta pegar do .env OU do ambiente do sistema (Vercel)
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Injeta o valor da chave diretamente no código durante o build
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})
