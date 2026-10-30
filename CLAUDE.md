# Zilinski Escadas — Calculadora / ERP

Sistema interno da Zilinski Escadas: calculadora de escadas, propostas, contratos e fichas técnicas em PDF, fila de produção, tabela de entregas, visitas e compras.

# Regras de trabalho em duas máquinas (OBRIGATÓRIO)

Este projeto é trabalhado por **duas instâncias do Claude Code em máquinas diferentes** (empresa e casa).
A memória de cada Claude fica só na máquina dele. O que as duas compartilham é **este repositório git**.
Por isso estas regras valem em toda sessão:

1. **Antes de qualquer coisa:** `git pull` no `main` e ler a seção **"Diário"** do `ATUALIZACOES.md`, pra saber o que a outra máquina fez.
2. **Toda vez que alterar qualquer coisa** (código, servidor, banco, deploy, `.env`, configuração):
   - adicionar uma entrada **no topo** do Diário em `ATUALIZACOES.md` com: data, máquina, o que mudou, onde mudou e o que ficou pendente;
   - atualizar a seção **"📍 Estado atual"** deste `CLAUDE.md` se algo dela mudou (URLs, servidores, onde fica cada coisa, regras de negócio importantes);
   - fazer commit e `git push` logo em seguida. Nunca deixar alteração parada só numa máquina.
3. **Nunca** colocar senhas, chaves ou tokens em arquivo versionado. Segredo fica só no `.env` (local ou do servidor). Nunca pedir pro usuário colar senha/chave no chat: criar um script/atalho que grave direto no `.env`.
4. Se o `git pull` der conflito, resolver **juntando as duas versões**. Nunca descartar o trabalho da outra máquina.
5. Coisas que o usuário precisa fazer (cadastros, testes, contas externas) vão na lista **"⏳ Pendências do usuário"** abaixo, pra qualquer uma das máquinas lembrar.
6. Deploy em produção só quando o usuário falar explicitamente ("pode subir"). Antes, fazer backup do arquivo no servidor.
7. Falar com o usuário em português informal (chamar de "mano"). Se tiver dúvida, perguntar.

# 📍 Estado atual

| Item | Onde |
|---|---|
| Repositório | github.com/gabrielhweb/calculadora-de-escadas (branch `main`) |
| Pasta local (empresa) | `C:\Users\sosob\Desktop\Zilinski\calculadora escada` |
| Hospedagem do site | Vercel (`vercel.json` com rewrite SPA; funções em `api/`) — URL de produção: ⚠️ não anotada ainda |
| Banco principal | Firebase Firestore, projeto `gen-lang-client-0064759207` (config em `firebase-applet-config.json`, regras em `firestore.rules`) |
| Coleções principais | `contracts`, `production_queue`, `saved_quotes`, `transportadoras` |
| Login | Google (Firebase Auth, popup). Não funciona em `localhost` (domínio não autorizado) |
| Banco secundário | Supabase (`src/services/supabaseClient.ts`) e Postgres via `server.js` (`DATABASE_URL`) |
| IA | Gemini (`api/gemini.ts`, `API_KEY`) |
| Segredos | `.env` na raiz (não versionado). Variáveis usadas: `API_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `EMAILJS_*`, `GOOGLE_MAPS_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `VITE_FIREBASE_API_KEY` |
| Rodar local | ⚠️ `vite.config.ts` foi apagado no commit 5e36f51; sem ele a página fica branca ("process is not defined") |

## Regras de negócio importantes

- **Medidas de frete da escada fechada (prancha):** uma conta só em `src/utils/freightDimensions.ts` (`calcFoldedPackage`), usada na Tabela de Entregas, texto da transportadora, página de contrato, ficha técnica e 3D. Calibrada com escadas reais (Carlos Reginaldo 5,34 × 1,38 m / 140 kg; Marco Peruchi 7,44 × 1,30 m). Corrimão padrão 80 cm.
- **Texto da transportadora:** `src/utils/freightQuoteText.ts`; dados do cliente buscados em todas as origens por `src/utils/clientInfo.ts`. Texto editado fica salvo no campo `freightQuoteText` do contrato; medidas editadas manualmente ficam em `hingesQty`.
- **Contrato baixado em Meus Contratos** busca degraus/medidas em qualquer nível do JSON (igual à ficha técnica).

# ⏳ Pendências do usuário

- [ ] Mandar fotos/vídeos de perto da escada (viga, degrau, dobradiça, pé do poste do corrimão, chapas de fixação) ou logar no Instagram no navegador do app, pra deixar o 3D idêntico.
- [ ] Informar o peso real da escada do Marco Peruchi pra conferir o peso calculado (deu 205 kg).
- [ ] Conferir no site: contrato da Andréia baixado em Meus Contratos agora sai com os degraus certos.
- [ ] Testar o buscador da página Meus Contratos.
- [ ] Explicar como devem ser "Modalidade de coleta" e "Tomador do frete" no texto da transportadora (hoje fixos).
- [ ] Informar a URL de produção do site pra anotar aqui.
- [ ] Decidir se restaura o `vite.config.ts` (necessário pra rodar local).
- [ ] Conferir o visual novo (cores e ícones) nas páginas que pedem login: Meus Contratos, Controle de Contratos e Compras.
- [ ] Falar "pode subir" quando quiser o visual novo no site.

# 🧱 Estrutura

```
api/                 Funções serverless da Vercel (gemini, email, rota diária)
public/              Arquivos estáticos
scripts/             Scripts avulsos de manutenção do banco
server.js            Servidor Express/Postgres (uso auxiliar)
src/
  App.tsx, index.tsx Entrada e rotas
  firebase.ts        Inicialização do Firebase
  types.ts           Tipos (SavedContract, CalculatorInput, ProposalOption...)
  components/        Calculadora, propostas, visualizador 2D/3D da escada, guarda-corpo
  pages/             Telas: Calculator, Contract, ContractsList (Meus Contratos),
                     DeliveriesTable (Tabela de Entregas), ProductionQueuePage,
                     Carriers (transportadoras), visitas, compras, recibos
  utils/             Geradores de PDF (contrato, ficha técnica, produção, recibos),
                     frete (freightDimensions, freightQuoteText), clientInfo
  services/          Supabase
  data/              Dados fixos de contratos antigos
```
