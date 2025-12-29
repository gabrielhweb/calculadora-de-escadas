
# Documentação Técnica - Sistema Zilinski

Este documento serve como guia para desenvolvedores que venham a dar manutenção ou evoluir o sistema da Zilinski Distribuidora.

## 1. Visão Geral da Arquitetura

O projeto é uma **Single Page Application (SPA)** construída com tecnologias modernas de frontend, focada em performance e facilidade de deploy.

- **Stack Principal:** React 18 + TypeScript + Vite.
- **Estilização:** Tailwind CSS (Utility-first).
- **Banco de Dados & Auth:** Supabase (BaaS - Backend as a Service).
- **IA Generativa:** Google Gemini API (via `@google/genai`) para cálculos de rota e geração de cláusulas contratuais.
- **Geração de Documentos:** `jspdf` para criação de PDFs client-side.

## 2. Estrutura de Pastas (`src/`)

- **/components**: Componentes de UI reutilizáveis (Formulários, Visualizador 3D, Botões).
  - `StaircaseVisualizer.tsx`: Engine 2D/3D SVG para renderização das escadas. Contém lógica matemática complexa para projeção isométrica.
- **/pages**: Telas principais (Rotas).
  - `Calculator.tsx`: O "cérebro" da aplicação. Gerencia o estado dos inputs e invoca as funções de cálculo.
  - `Contract.tsx`: Lógica de formulário jurídico e integração com IA para cláusulas.
- **/services**: Integrações com APIs externas.
  - `supabaseClient.ts`: Inicialização do cliente Supabase.
  - `storage.ts`: Camada de abstração. Decide se salva no Supabase (se online) ou LocalStorage (fallback offline).
- **/types**: Definições de Tipos TypeScript (Interfaces). **Crucial manter atualizado.**
- **/utils**: Funções auxiliares puras (cálculo de preço, formatação de moeda, integração Gemini).

## 3. Banco de Dados (Supabase)

O sistema utiliza uma abordagem híbrida/NoSQL dentro do Postgres.

### Tabela: `quotes`
Armazena os orçamentos.
- `id` (text, PK): ID único gerado via timestamp (pode ser migrado para UUID).
- `content` (jsonb): Armazena todo o objeto do orçamento (`SavedQuote`). Isso permite flexibilidade total para adicionar novos campos (como `status`, `logs`) sem precisar fazer migrations no banco a cada mudança.
- `created_at` (timestamptz): Data de criação.

**Nota sobre Segurança (RLS):**
Atualmente, o acesso é público ou via chave anônima. Para a evolução do sistema (Login), deve-se ativar RLS (Row Level Security) nesta tabela para que apenas usuários autenticados possam ler/escrever.

## 4. Integrações Chave

### Google Gemini (IA)
Utilizado em dois pontos:
1.  **Logística (`utils.ts`):** A função `getRouteInfoFromGemini` usa a IA para estimar distâncias e pedágios quando a API do Google Maps não está disponível ou para evitar custos de API de Maps.
2.  **Contratos (`Contract.tsx`):** Gera cláusulas jurídicas baseadas em linguagem natural.

### Visualizador de Escadas (`StaircaseVisualizer.tsx`)
Não utiliza bibliotecas 3D pesadas (como Three.js) propositalmente para manter o site leve. O 3D é um "falso 3D" calculado matematicamente usando projeção de pontos em um SVG (`projectPoint`).

## 5. Como Rodar o Projeto

1.  Instale dependências: `npm install`
2.  Configure `.env` (Veja README.md).
3.  Rodar local: `npm run dev`
4.  Build: `npm run build`

## 6. Próximos Passos (Roadmap Técnico Sugerido)

1.  **Autenticação:** Implementar `Supabase Auth` para criar níveis de acesso (`admin` vs `operacional`).
2.  **Storage:** Criar Buckets no Supabase para upload de fotos/vídeos das obras.
3.  **Dashboard:** Criar uma rota `/admin` que consome a tabela `quotes` e exibe em formato Kanban (A fazer -> Fazendo -> Feito).

---
*Documentação gerada em: 26/12/2025*
