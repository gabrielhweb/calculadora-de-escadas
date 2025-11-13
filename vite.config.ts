import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A configuração de proxy do servidor foi removida, pois não é mais necessária.
  // A chamada para a API de mapas agora é feita através do Gemini com a ferramenta do Google Maps.
})