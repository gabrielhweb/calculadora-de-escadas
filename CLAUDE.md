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
5. Coisas que o usuário precisa fazer (cadastros, testes, contas externas) vão na lista **"⏳ Pendências do usuário"** abaixo, pra qualquer uma das máquinas lembrar. Os itens de **"👀 Acompanhar"** são conferidos no site a cada entrada nova do Diário.
6. **Todo push no `main` publica sozinho no site** (a Vercel faz o deploy automático). Por isso, mudança que o usuário ainda não aprovou pra produção não vai pro `main`: fica sem commit ou num branch separado até ele falar "pode subir". Se algo quebrar, dá pra voltar o deploy anterior no painel da Vercel (Deployments → Promote/Rollback).
7. Falar com o usuário em português informal (chamar de "mano"). Se tiver dúvida, perguntar.

# 📍 Estado atual

| Item | Onde |
|---|---|
| Repositório | github.com/gabrielhweb/calculadora-de-escadas (branch `main`) |
| Pasta local (empresa) | `C:\Users\sosob\Desktop\Zilinski\calculadora escada` |
| Pasta local (casa) | `C:\Users\Micro\Projetos\calculadora-escadas` |
| Hospedagem do site | Vercel (`vercel.json` com rewrite SPA; funções em `api/`) — site: **https://calculadora-de-escadas-jxz3.vercel.app** · painel: vercel.com/gabriel-silva-rodrigues-projects/calculadora-de-escadas. Deploy automático a cada push no `main` |
| Banco principal | Firebase Firestore, projeto `gen-lang-client-0064759207` (config em `firebase-applet-config.json`, regras em `firestore.rules`) |
| Coleções principais | `contracts`, `production_queue`, `saved_quotes`, `transportadoras`; visitas em `contracts/painel_visitas` (`isVisitPanel: true`); configurações de Compras em `settings`. Regras publicadas no console ficam na aba **Segurança** do Firestore e batem com `firestore.rules` (16/11/2026) |
| Login | Google (Firebase Auth, popup). Não funciona em `localhost` (domínio não autorizado). Lista de e-mails autorizados em `api/_auth.ts` (usada pelo site e pelas funções da Vercel); o Firestore também exige o uid na coleção `admins` |
| Funções da Vercel | `api/email`, `api/gemini`, `api/calcular-rota-diaria` exigem `Authorization: Bearer <token do Firebase>` de e-mail autorizado (`requireAuthorizedUser` em `api/_auth.ts`) |
| Banco secundário | Supabase (`src/services/supabaseClient.ts`) e Postgres via `server.js` (`DATABASE_URL`) |
| IA | Gemini (`api/gemini.ts`, `API_KEY`) |
| Segredos | `.env` na raiz (não versionado). Variáveis usadas: `API_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `EMAILJS_*`, `GOOGLE_MAPS_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `VITE_FIREBASE_API_KEY` |
| Rodar local | `npm run dev` (ou preview "dev" do `.claude/launch.json`), porta 5173. `vite.config.ts` só mexe no modo dev (define `process.env`). Login Google não funciona em localhost |

## Regras de negócio importantes

- **Medidas de frete da escada fechada (prancha):** uma conta só em `src/utils/freightDimensions.ts` (`calcFoldedPackage`), usada na Tabela de Entregas, texto da transportadora, página de contrato, ficha técnica e 3D. Calibrada com escadas reais (Carlos Reginaldo 5,34 × 1,38 m / 140 kg; Marco Peruchi 7,44 × 1,30 m). Corrimão padrão 80 cm.
- **Texto da transportadora:** `src/utils/freightQuoteText.ts`; "Modalidade de coleta" e "Tomador do frete" saem por padrão "levada até a base da transportadora" / "remetente", mas o Gerar Contrato pergunta (campos `logistics.freightPickup` / `freightPayer`); dados do cliente buscados em todas as origens por `src/utils/clientInfo.ts`. Texto editado fica salvo no campo `freightQuoteText` do contrato; medidas editadas manualmente ficam em `hingesQty`.
- **Contrato baixado em Meus Contratos** busca degraus/medidas em qualquer nível do JSON (igual à ficha técnica).

# ⏳ Pendências do usuário

## 🏠 Só na máquina de CASA
- [ ] **Revogar no GitHub o token `ghp_...` antigo** que estava na URL do remote. Só dá pra fazer na máquina de casa — o Claude de casa deve lembrar o usuário disso no começo da sessão até ser feito.

## 👀 Acompanhar (quem resolve é o cliente, no controle de contratos dele)
Não cobrar o usuário. **Toda vez que for escrever no Diário**, abrir o site logado (Meus Contratos / Fila / Tabela de Entregas), ver se cada item abaixo já foi resolvido e anotar na entrada do Diário ("resolvido" ou "ainda pendente"). Quando resolvido, tirar daqui.
- [ ] Beatriz Grance Rinn: em Meus Contratos está "Falta assinar", mas na Fila está "Contrato assinado e pagamento inicial feito" (50% pago).
- [ ] Hilton e Paulo Henrique: sem data de entrega na Tabela de Entregas e sem CPF do destinatário no texto da transportadora.
- [ ] Alexandre Bergamo: está como Entregue/Concluído — confirmar que já recebeu.

## Testes no site
- [ ] Testar o envio de e-mail da Fila (manda e-mail de verdade pro cliente, por isso não foi testado pelo Claude).
- [ ] Testar o Painel de Visitas com dois logins: visita cadastrada num tem que aparecer no outro.

## Decisões / informações do usuário
- [ ] **Liberar no Firestore a conta que vê a Tabela de Entregas vazia:** a coleção `admins` só tem 2 documentos (um é gaguisilva15 = `WSqKvTSG3HaelRBsFEsiaO1sGfD3`), mas 3 e-mails são autorizados em `api/_auth.ts`. Conta sem documento em `admins` faz login mas o banco devolve tudo vazio. Entrando com a conta vazia, o site mostra um aviso amarelo com o UID (botão "Copiar UID"); criar em Firestore → Dados → `admins` um documento com esse UID como ID.
- [ ] Testar no site o frete por IA (Calculadora) e as perguntas novas de transportadora no Gerar Contrato ("Como a escada chega na transportadora?" / "Quem paga o frete?").
- [ ] Revisar a conta do preço dos tubos do guarda-corpo (deixado pra depois).
- [ ] Usuário vai conferir se o 3D já está parecido com a escada real (acha que sim); se não, mandar fotos de perto.
- [ ] Ver se o canto reto que a máquina de casa aplicou resolveu os "quadrados com ponta arredondada"; se sim, tirar este item.

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
```

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
