# Zilinski Distribuidora - Sistema de Orçamentos

Sistema profissional para cálculo de escadas, precificação dinâmica, logística e geração de contratos em PDF.

## 🚀 Funcionalidades

- **Calculadora de Escadas**: Algoritmo que define degraus, altura e pisada ideal.
- **Orçamentos PDF**: Geração automática de propostas comerciais.
- **Logística Integrada**: Cálculo de frete e pedágios usando IA (Google Gemini) e Google Maps.
- **Nuvem & Local**: Sincronização de orçamentos via Supabase ou backup local.
- **Contratos Jurídicos**: Geração de contratos de venda preenchidos automaticamente.

## 🛠️ Tecnologias

- **Frontend**: React + Vite + TypeScript
- **Estilo**: Tailwind CSS
- **IA**: Google Gemini 2.5 Flash (via @google/genai)
- **Banco de Dados**: Supabase (PostgreSQL)
- **PDF**: jsPDF

## ⚙️ Configuração

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/zilinski-app.git
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com suas chaves:
```env
API_KEY=sua_chave_gemini_aqui
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_anon_supabase
```

4. Rode o projeto:
```bash
npm run dev
```

## ☁️ Deploy

Para colocar online (Vercel/Netlify), lembre-se de adicionar as variáveis de ambiente (`API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`) no painel de configuração da hospedagem.

---
Desenvolvido para Zilinski Distribuidora.
