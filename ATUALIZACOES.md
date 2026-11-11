# Atualizações

Registro do que cada máquina (empresa / casa) mudou no projeto. Ler antes de começar a trabalhar.

# Diário

### 2026-11-11 — [casa] — Contrato: "Gerar PDF" agora pergunta se quer salvar
- **O que mudou:** a tela Gerar Contrato tem dois botões separados — "Gerar PDF" (só baixa) e "Salvar na Timeline" (grava no banco). O contrato do Hilton José Pereira Cardim (11/11) foi só baixado e não apareceu em Meus Contratos. Agora, depois de gerar o PDF, se o contrato ainda não foi salvo nessa tela, aparece "O PDF foi gerado, mas o contrato ainda NÃO está salvo no sistema. Salvar agora?" (na edição: "as alterações ainda NÃO foram salvas").
- **Onde:** `src/pages/Contract.tsx` (`handleGeneratePDF`, estado `contractSaved`).
- **Pendente:** cadastrar o contrato do Hilton no sistema (dados no PDF que o usuário mandou).

### 2026-11-09 — [casa] — Oficina: placas também em Recibo de Pagamento, Calculadora de Peso e Recibo de Instalação
- **O que mudou:** os painéis principais dessas telas viraram placas de aço (`of-plate`) e o título da Calculadora de Peso ficou em estêncil. Os 3 cartões coloridos da Calculadora de Peso (Degraus/Patamares/Vigas, com faixa colorida em cima) ficaram como estão, só com canto reto. Usuário aprovou o estilo.
- **Onde:** `src/pages/CustomPaymentReceipt.tsx`, `src/components/WeightCalculator.tsx`, `src/pages/WeightCalculatorPage.tsx`, `src/pages/InstallationReceipt.tsx` (só a linha da placa no commit; a retirada de CPFs continua sem commit).
- **Pendente:** nada.

### 2026-11-09 — [casa] — Estilo Oficina espalhado pelo site
- **O que mudou:** `PageTitle` (13 páginas) em estêncil com faixa zebrada embaixo (`.of-title`); menu lateral com faixa zebrada no topo, "ZILINSKI" e títulos de grupo em estêncil, item ativo preto com letra dourada; **canto reto em todo o site** (`:is(main, aside) :is(.rounded…)` no `index.html`), menos o que tem `.keep-round` (cartões metálicos de Meus Contratos); 28 painéis brancos com sombra viraram placas de aço parafusadas (`of-plate`) em Calculadora, Contrato, Transportadoras, Entregas, Fila, Orçamentos Salvos, Compras (5 telas) e Visitas. `.of-plate` agora tem prioridade sobre o `bg-white` do Tailwind (`html .of-plate`).
- **Onde:** `index.html`, `src/components/PageTitle.tsx`, `src/components/Layout.tsx`, `src/pages/*`, `src/pages/Purchases/*`, `src/components/visitas/*`.
- **Pendente:** telas com caixas em outro formato (Recibo Pagamento, Calculadora de Peso, Recibo Instalação) estão com canto reto mas sem parafuso; Recibo Instalação ficou de fora (tem a mudança de CPFs não commitada no arquivo). Usuário conferir as telas logado.

### 2026-11-09 — [casa] — Estilo "Oficina" começou pela Calculadora + site branco por padrão
- **O que mudou:** novas classes globais em `index.html`: `.of-stencil` (fonte Saira Stencil One, caixa alta), `.of-zebra` (faixa preta e amarela de obra) e `.of-plate` (placa de aço: canto reto, chapa cinza, 4 parafusos nos cantos feitos com `radial-gradient`; versão escura incluída). Aplicado na Central de Calculadoras: faixa zebrada + título em estêncil, painéis "Medidas" e "Opções Calculadas" como placas, botão "Calcular Opções" em estêncil com borda preta, cartão de opção com canto reto. **Tema claro virou o padrão**: o `Layout` usa a chave `theme_v2` (quem tinha escuro salvo começa no branco; o botão sol/lua continua).
- **Onde:** `index.html`, `src/components/Layout.tsx`, `src/pages/Calculator.tsx`, `src/components/CalculatorForm.tsx`, `src/components/ProposalOptions.tsx`.
- **Pendente:** usuário aprovar a Calculadora; depois espalhar as classes `of-*` pras outras telas (Contrato, Meus Contratos — mantendo os cartões metálicos —, Fila, Entregas, Visitas, Compras) e pro menu lateral.

### 2026-11-09 — [casa] — 3D volta à cara antiga; viga da parede com zigue-zague só em cima
- **O que mudou:** a pedido do usuário, o 3D saiu do estilo planta azul e voltou ao visual anterior (aço preto, parede cinza, fundo claro) — `StaircaseVisualizer.tsx` restaurado da versão 4a336c3. A viga da parede continua sendo a chapa cortada, agora com **zigue-zague só em cima** (onde apoia cada degrau) e **reta embaixo**, paralela à inclinação. Os ícones das abas da Calculadora continuam em planta azul.
- **Onde:** `src/components/StaircaseVisualizer.tsx`.
- **Pendente:** usuário conferir no site; perguntar se os ícones azuis também voltam.

### 2026-11-09 — [casa] — 3D: viga da parede em zigue-zague, igual à escada real
- **O que mudou:** com fotos de escadas reais (Instagram @zilinski.escadas + prints do usuário), a viga da parede deixou de ser uma chapa reta e virou a chapa cortada em zigue-zague (um "dente" por degrau, `extrudeGeometry` de um `THREE.Shape`), que aparece encostada na parede com a escada fechada e embaixo dos degraus com ela aberta. Corrimão (3 tubos, poucos postes), degrau de chapa com aba e viga de fora fina já batiam com as fotos.
- **Onde:** `src/components/StaircaseVisualizer.tsx` (`StairModel`).
- **Pendente:** se o usuário mandar fotos de perto, dá pra refinar dobradiça e o pé do corrimão. Pela navegação do app não dá pra pausar vídeos do Instagram; vídeos mandados como arquivo (WhatsApp) funcionam.

### 2026-11-09 — [casa] — Ícones da Calculadora e 3D em estilo "planta azul" (blueprint)
- **O que mudou:** os 4 ícones das abas da Central de Calculadoras ficam num quadrado azul quadriculado com traço branco (aba ativa com borda dourada). O 3D do visualizador ficou como planta: fundo azul `#1d4e89`, todas as peças com o mesmo material (`BlueprintMaterial`: azul translúcido + contorno branco com `Edges` do drei; pisante de madeira um pouco mais claro) e o chão virou quadriculado branco (linha a cada 25cm). Os outros desenhos (2D, guarda-corpo, patamar, PDFs) ficaram como estavam, a pedido do usuário.
- **Contexto:** o usuário escolheu o estilo "Oficina" (faixa zebrada, placas de aço parafusadas, letra de estêncil) pro site num fundo branco, mantendo os cartões metálicos de Meus Contratos; ainda **não aplicado** — só os desenhos azuis por enquanto.
- **Onde:** `src/pages/Calculator.tsx`, `src/components/StaircaseVisualizer.tsx`.
- **Pendente:** deixar o modelo 3D mais parecido com as escadas reais — usuário vai mostrar fotos do Instagram no navegador do app. Confirmar se aplica o estilo Oficina no resto do site.

### 2026-11-09 — [casa] — "Rota no Maps" nos endereços da Tabela de Entregas e da Tabela de Visitas
- **O que mudou:** embaixo de cada endereço aparece "📍 Rota no Maps", que abre o Google Maps já traçando a rota até o cliente (`google.com/maps/dir/?api=1&destination=<endereço>`; no celular abre o app). Usa o endereço escrito, não as coordenadas (que nas visitas costumam estar no padrão do centro de SP). Não aparece na impressão da Tabela de Entregas. Pedido por áudio.
- **Onde:** `src/pages/DeliveriesTable.tsx`, `src/components/visitas/TabelaVisitasRow.tsx`.
- **Pendente:** o áudio também cita uma tarefa do Mercado Livre/estoque que a Sofia ia passar — ainda não chegou.

### 2026-11-06 — [casa] — Orçamento: "Dados p/ frete" já sai com nome, CPF e endereço
- **O que mudou:** o formulário "Dados do Cliente" do orçamento (`UserDataForm`) repassa o que foi digitado (nome, CPF/CNPJ, rua, número, bairro, cidade, UF, CEP) pro botão "Dados p/ frete", que antes saía com "FALTA INFORMAÇÃO" nesses campos. CEP: usa o do formulário ou, se vazio, o "CEP de Destino" do frete. Pedido por vídeo. Testado no navegador.
- **Onde:** `src/components/ProposalOptions.tsx`.
- **Pendente:** nada.

### 2026-11-04 — [casa] — Degraus contados errado com guarda-corpo avulso, Chapa Xadrez na produção e botão de dados p/ frete
- **O que mudou:**
  1. **Degraus a menos na produção (caso Carla):** desenho de produção (`drawProductionPage`) e Ficha Técnica (`technicalPdfGenerator`, 2 lugares) faziam `degraus = total − landings.length`, contando guarda-corpo/portão **avulsos** como patamar. Contrato com escada + guarda-corpo avulso saía com 1 degrau a menos. Agora só patamares de verdade descontam. A Tabela de Entregas passou a mostrar `structureSteps` (degraus da estrutura) antes do total de peças, igual contrato e ficha. Obs.: o contrato salvo da Carla Polastro Fontolan tem 10 degraus (`desiredSteps` 10, opção 1); não achei no código um caminho que transforme 11 em 10 no contrato — se o orçamento era 11, o contrato foi gerado com 10.
  2. **Chapa Xadrez na produção:** o desenho de produção não recebia o material (Chapa Xadrez usa o desenho liso, sem indicação). Agora mostra "PISANTE: CHAPA XADREZ" (ou madeira/metal/chapa vazada) abaixo do lado dos furos, vindo da Ficha Técnica e do botão de folha de produção do Contrato. O contrato já levava "CHAPA XADREZ" (`contractGenerator`, conferido no contrato da Hernandez/Carla que tem `chapa_xadrez`).
  3. **Dados p/ frete:** na Tabela de Entregas, contratos sem transportadora ganharam o botão "Dados p/ frete" (mostra o texto de cotação na hora); no orçamento, cada opção tem "Dados p/ frete" que copia medidas e peso da escada fechada + CEP de destino (mesmo texto da transportadora).
- **Onde:** `src/utils/productionPdfGenerator.ts`, `src/utils/technicalPdfGenerator.ts`, `src/pages/Contract.tsx`, `src/pages/DeliveriesTable.tsx`, `src/components/ProposalOptions.tsx`.
- **Pendente:** usuário decidir se tira PESO/CUSTO AÇO da impressão da Tabela de Entregas (o pedido em texto diz que é proibido, mas antes ele pediu pra deixar como está). O texto de frete leva o peso (transportadora precisa).

### 2026-11-04 — [casa] — Visualizador 2D/3D: estimativa preliminar de peso, material e matéria-prima
- **O que mudou:** nova função `estimatePreliminaryMaterials` em `freightDimensions.ts` (reaproveita `calcFoldedPackage` + `calcLandingsWeightKg`; custo = kg de aço × `STEEL_PRICE_PER_KG` 13,80). O visualizador mostra um quadro "ESTIMATIVA PRELIMINAR (NÃO VAI NO PDF)" com peso total, material (aço carbono 3mm + pisante) e custo aproximado do aço, no 2D e no 3D. O quadro fica fora do `internalCanvasRef` (área exportada) e some durante a exportação, então não entra em nenhum PDF. Também corrigido: o 3D desenhava pisante de madeira mesmo com metal escolhido (default `'madeira'` fixo); agora segue `inputData.treadMaterial`.
- **Onde:** `src/utils/freightDimensions.ts`, `src/components/StaircaseVisualizer.tsx`.
- **Pendente:** usuário decidir se tira peso/material/custo que **já existiam** em outros documentos: Ficha Técnica (peso por degrau e total), impressão da Tabela de Entregas (PESO ESCADA / CUSTO AÇO), contrato e proposta (material do pisante). A Tabela de Entregas usa outra conta de peso (sem dobradiças e corrimão: ex. 114,7 kg vs 140 kg).

### 2026-11-04 — [casa] — Fila: "Corrigir Vínculo" aparecia mesmo com cartão existente
- **O que mudou:** testado logado no site: ao clicar em "Corrigir Vínculo" do Paulo Henrique, a checagem nova respondeu "já tem cartão na fila". Causa: o `updateItems` juntava `[orçamentos, contratos, cartões]` e o filtro de duplicados fica com o primeiro de cada `contractId`, então o contrato "solto" (status Falta assinar) escondia o cartão. Agora os cartões vêm antes dos contratos. Nenhum cartão foi criado no teste.
- **Onde:** `src/pages/ProductionQueuePage.tsx` (`updateItems`).
- **Visto no console do site:** "Error fetching settings" e "Firestore Error [list] on saved_quotes: Missing or insufficient permissions" — as regras publicadas também não liberam listar `saved_quotes` (Orçamentos da Fila e Orçamentos Salvos podem estar vazios por isso).
- **Pendente:** conferir no site que Paulo Henrique e Beatriz aparecem como cartão normal.

### 2026-11-04 — [casa] — Meus Contratos quebrava ao fazer login com a tela aberta (React #310)
- **O que mudou:** os dois `useState` dos filtros (entrega/pagamento) ficavam depois do `if (!user) return "Acesso Restrito"`. Ao logar com a tela aberta, o número de hooks mudava e o React quebrava ("Algo deu errado… Minified React error #310"). Bug antigo (commit 9654bb9, março). Os hooks subiram pra antes do `return`. Conferido: nenhuma outra tela tem hook depois de `if (!user) return`.
- **Onde:** `src/pages/ContractsList.tsx`.
- **Pendente:** nada.

### 2026-11-04 — [casa] — Descoberto: push no `main` = deploy automático no site
- **O que mudou:** conferido o bundle publicado em https://calculadora-de-escadas-jxz3.vercel.app: ele já tem tudo até o commit 23789c2 (cards metálicos, visitas em `contracts/painel_visitas`, "Corrigir Vínculo" novo, visual novo da empresa). Ou seja, a Vercel publica sozinha a cada push no `main` — as entradas antigas que dizem "não subiu pra produção" estavam erradas. `/api/gemini` sem token responde 401 no ar (o `import './_auth.js'` funciona na Vercel). URL do site anotada no `CLAUDE.md` e regra 6 reescrita.
- **Onde:** `CLAUDE.md`.
- **Pendente:** usuário vai logar no site pelo navegador do app pra testar as telas logado.

### 2026-11-04 — [casa] — Fila: "Corrigir Vínculo" usa o sinal do contrato e não duplica
- **O que mudou:** o botão "Corrigir Vínculo" (aparece quando um contrato não tem cartão na `production_queue`, ex.: salvo com "Adicionar à fila" desmarcado) agora usa o `downPayment` salvo no contrato (só divide 50/50 se não houver sinal) e confere antes se já existe cartão com aquele `contractId`, pra não duplicar. Casos vistos: Paulo Henrique, Beatriz Grance Rinn e Geraldo Ribeiro Costa (estão em "Falta assinar"). Usuário disse que não quer o carrossel nos cards de Meus Contratos.
- **Onde:** `src/pages/ProductionQueuePage.tsx` (`fixQueueLink`).
- **Pendente:** depois de subir, clicar em "Corrigir Vínculo" nesses 3 (ou em "Produção →" em Meus Contratos quando assinarem) e conferir os valores no cartão.

### 2026-11-04 — [casa] — Meus Contratos: cards com frente de cartão metálico
- **O que mudou:** a parte de cima de cada card virou uma "frente de cartão de crédito" (inspirada num vídeo que o usuário mandou): degradê metálico **grafite** quando está A Receber e **dourado** quando está Recebido, brilho que passa ao passar o mouse, "ZILINSKI" no canto, um chip, nome do cliente, datas e valor. Etiquetas e botões (Contrato, Ficha, G. Corpo, Recibo, Frete) continuam embaixo, iguais. Editar/Excluir aparecem ao passar o mouse, como antes.
- **Onde:** `src/pages/ContractsList.tsx`.
- **Pendente:** conferir logado no site (precisa subir). Não tem o carrossel do vídeo (cartões trocando de lado), só o visual. Os cards usam cantos arredondados, que o usuário disse não gostar (ver entrada de 30/10).

### 2026-11-04 — [casa] — Contrato: descrição do produto numerada como 1.1
- **O que mudou:** no PDF do contrato, a frase do objeto ("Escada articulada lateral...", "Escada fixa...", guarda-corpo ou adendo) agora começa com "1.1", logo abaixo de "1.Do objeto contratual.". As outras cláusulas já citavam "item 1.1". Pedido por print do WhatsApp.
- **Onde:** `src/utils/contractGenerator.ts`.
- **Pendente:** conferir um contrato gerado no site depois de subir.

### 2026-11-03 — [casa] — Painel de Visitas: salva em `contracts/painel_visitas` (erro de permissão)
- **O que mudou:** o painel dava "Missing or insufficient permissions" porque as regras **publicadas** no Firestore não liberam a coleção `settings` (o `firestore.rules` do repositório libera, mas não é o que está no ar). Em vez de mexer nas regras, as visitas passaram pro documento `contracts/painel_visitas` com `isVisitPanel: true` (mesmo jeito que Compras guarda produtos em `contracts`). Meus Contratos e o Termo de Instalação ignoram esse documento; Tabela de Entregas e Fila já filtram por status. As visitas que ficaram no navegador sobem sozinhas ao abrir o painel.
- **Onde:** `src/pages/VisitReceipt.tsx`, `src/pages/ContractsList.tsx`, `src/pages/InstallationReceipt.tsx`.
- **Pendente:** testar no site logado (precisa subir). Se um dia publicarem a regra de `settings`, dá pra voltar pra lá. A tela de Compras também grava em `settings/production_costs` e deve ter o mesmo erro.

### 2026-11-03 — [casa] — Tabela de Entregas: texto da transportadora só quando é envio por transportadora
- **O que mudou:** a coluna TRANSPORTADORA mostra o texto (e o botão Copiar) só quando o contrato tem `freightMode = 'transportadora'` (mesma regra do PDF do contrato) ou quando o texto já foi editado à mão. Nos outros casos (ex.: instalação feita pelo pai do usuário) aparece só "-". Pedido por áudio.
- **Onde:** `src/pages/DeliveriesTable.tsx`.
- **Pendente:** contratos antigos sem `freightMode` salvo e que eram por transportadora vão aparecer com "-"; nesses casos ainda não há botão pra forçar o texto aparecer. Erro "Missing or insufficient permissions" no Painel de Visitas: as regras **publicadas** no Firestore não liberam a coleção `settings` (o `firestore.rules` do repositório libera) — usuário precisa publicar a regra no console do Firebase.

### 2026-11-02 — [casa] — Correções 1 a 5 da análise (ANALISE.md)
- **O que mudou:**
  1. Saiu o `removeDuplicates()` que rodava ao abrir o site e **apagava** contratos com "Everton"/"Severini" no nome (commit c531384).
  2. Saíram os remendos que forçavam status/valores e **recriavam** os contratos e cartões da fila de Chalita, Maria Helena e Bergamo; `src/data/` (dados fixos desses clientes) foi apagado (49b4d75). Agora esses contratos se comportam como qualquer outro: dá pra apagar e mudar status.
  3. Funções da Vercel exigem login com e-mail autorizado: novo `api/_auth.ts` (valida o token **e** confere a lista), usado por `/api/email`, `/api/gemini` e `/api/calcular-rota-diaria`. O site manda o token. A rota aceita no máximo 27 visitas e só usa Google/Mapbox quando conseguiu ler a cota no Postgres (sem banco → OSRM grátis). A lista de e-mails agora fica só em `api/_auth.ts` (o `AuthProvider` importa de lá). (ccf76a9)
  4. `firebase-admin` removido (não era usado) e `npm audit fix`: 20 → 6 alertas (32bd364).
  5. Apagados 14 arquivos sem uso (Login antigo com admin/admin, Dashboard, Home, ProjectDetails, TabelaVisitasDia, scripts de correção de banco etc.) e o `ErrorBoundary` passou a envolver o app (aa96160).
- **Onde:** `src/App.tsx`, `src/pages/ContractsList.tsx`, `src/pages/ProductionQueuePage.tsx`, `api/*`, `src/components/AuthProvider.tsx`, `src/utils.ts`, `src/pages/VisitReceipt.tsx`, `src/index.tsx`, `package.json`.
- **Conferido:** `tsc` sem erro, build ok, Calculadora/Contratos/Fila/Visitas abrem sem erro no console (local, sem login). A checagem de login das funções foi testada com token ausente e falso (401).
- **Pendente:** (a) depois de subir, testar logado: frete por IA na Calculadora, "Calcular melhor rota" e envio de e-mail na Fila — as funções usam `import './_auth.js'` e não deu pra testar o deploy da Vercel daqui; (b) se a `DATABASE_URL` não estiver configurada na Vercel, a rota passa a usar sempre o OSRM; (c) 6 alertas do npm só saem com versão major (`firebase` por causa do `@grpc/grpc-js`, que só roda no Node, e `react-router` 6→7); (d) conferir no banco que os contratos de Chalita, Maria Helena e Bergamo estão com status/valores certos (o código não corrige mais sozinho). O `TechnicalBudget` **é usado** (o ANALISE.md estava errado nisso) e ficou.

### 2026-11-02 — [casa] — Spec Kit e Taskmaster instalados no projeto
- **O que mudou:** `specify init --here --integration claude` criou `.specify/` (templates, scripts, `memory/constitution.md`) e 10 skills `speckit-*` em `.claude/skills/`. `task-master init` criou `.taskmaster/` (config, templates de PRD), `.mcp.json` (servidor MCP do Taskmaster, chaves só placeholder), `.env.example`, acrescentou um bloco no fim do `CLAUDE.md` (import de `.taskmaster/CLAUDE.md`) e linhas no fim do `.gitignore` (logs, node_modules, .vscode, .idea etc.). Modelos do Taskmaster (main/research/fallback) = `sonnet` via `claude-code`, sem API key paga.
- **Onde:** raiz do repositório. **Ainda não commitado** — usuário pediu pra não commitar.
- **Pendente:** usuário revisar e decidir o commit. A constituição do Spec Kit (`.specify/memory/constitution.md`) ainda é o modelo vazio.

### 2026-11-02 — [casa] — Cartão "Opção" da Calculadora não encavala mais em tela menor
- **O que mudou:** com o menu lateral novo, em telas de ~1024 px o cartão de opção ficava estreito e as medidas se sobrepunham ("Alt/DegrPisanteLargura"); o botão "Baixar Desenhos" quebrava em 4 linhas. A grade de medidas agora segue a largura do cartão (`grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]`) em vez da largura da tela, e os cabeçalhos quebram linha com `flex-wrap`. Conferido no navegador em 1024 px e 1366 px. Só classes CSS, nenhuma função mudou.
- **Onde:** `src/components/ProposalOptions.tsx`.
- **Pendente:** nada. Obs.: pra ver local criei uma config do Vite temporária fora do repo (o `vite.config.ts` continua apagado). No modo claro o título "CENTRAL DE CALCULADORAS" fica branco em fundo cinza (já era assim antes do visual novo).

### 2026-10-29 — [casa] — Guarda-corpo: comprimento certo no orçamento e desenho do PDF
- **O que mudou:** guarda-corpo reto somava os campos ocultos de lado 2 e 3 (6 m saía como 8 m); nova função `getGuardrailItemLengthCm` conta só os lados do formato. No PDF do cliente: "Guarda-corpo de 6,00m de comprimento x 90cm de altura" e "Comprimento Total: X m" (saiu "metros lineares"). Desenho da proposta: espessura dos tubos proporcional (peças longas viravam bloco preto), peças ≥ 2,50 m usam a largura toda e guarda-corpo em L/U desenha todos os lados.
- **Onde:** `src/utils.ts`, `src/utils/productionPdfGenerator.ts`, `GuardrailCalculator`, `ProposalOptions`, `ProposalDocument` (commit 2169146). Já foi pro `main`.
- **Pendente:** revisar a conta do preço dos tubos do guarda-corpo (usuário pediu pra deixar pra depois).

### 2026-10-29 — [casa] — Painel de Visitas salvando no Firestore
- **O que mudou:** as visitas ficavam só no `localStorage` do navegador (nada ia pro banco e cada pessoa via só a sua lista). Agora ficam no documento `settings/painel_visitas` (campo `visitas`), com `onSnapshot` em tempo real e gravação por transação. Visitas antigas do navegador são migradas uma vez ao abrir o painel.
- **Onde:** `src/pages/VisitReceipt.tsx` (commit 246410a). Já foi pro `main`.
- **Pendente:** usuário testar com dois logins diferentes. Quem não está em `admins` não vê a lista (mesma regra dos contratos).

### 2026-10-29 — [casa] — Limpeza de scripts antigos e token do remote
- **O que mudou:** removidos ~160 arquivos soltos da raiz (`patch*.cjs`, `fix*.cjs`, `check*`, `dump*`, logs) e os submódulos vazios de backup; `desktop.ini` no `.gitignore`. A URL do `origin` tinha um token do GitHub e foi trocada pela URL sem token.
- **Onde:** raiz do repositório (commit 0003683).
- **Pendente:** usuário revogar o token antigo no GitHub. `scripts/setup_postgres.cjs` (só na máquina de casa, não versionado) tem a senha do Neon escrita no código.

### 2026-10-30 — [empresa] — ⏳ PARA FAZER DEPOIS: tirar o visual de "quadrados com ponta arredondada"
- **O que o usuário falou:** as telas ainda parecem as antigas, com os quadrados de ponta arredondada, e ele não gosta nem um pouco desse estilo. Quer mudar isso depois.
- **Onde está esse estilo hoje:** `rounded` (408 usos), `rounded-lg` (165), `rounded-xl` (59, alguns criados no commit bafb68b), `rounded-md` (52) em `src/pages` e `src/components`. Os cartões/caixas com borda + fundo + canto arredondado (ex.: caixa de Adendo, cartão de Medidas, cartões de opção da Calculadora, colunas de Meus Contratos) são o que mais dá essa cara.
- **Antes de começar:** perguntar ao usuário que estilo ele quer no lugar (ex.: cantos retos, seções separadas só por linha, sem caixas) e, se der, pedir um print/desenho de referência. Fazer uma tela de exemplo primeiro e só depois espalhar.
- **Não mexer:** `rounded-full` (bolinhas, fotos, ícones), 3D, PDFs.
- **Pendente:** tudo — nada foi alterado ainda.

### 2026-10-30 — [empresa] — Emojis das telas trocados por ícones de linha
- **O que mudou:** novo componente `Icon` (ícones de linha que acompanham o tamanho e a cor do texto). ~120 emojis em botões, títulos e etiquetas viraram ícones (lixeira, lápis, caminhão, setas de direção, impressora etc.). Ficaram de propósito: emojis dentro de listas de seleção (`<option>` não aceita ícone), mensagens de WhatsApp pro cliente, alertas/confirmações, PDFs, 3D, Recibo de Instalação e impressão de pedido. O placeholder da busca de Meus Contratos perdeu o 🔍.
- **Onde:** `src/components/Icon.tsx` (novo) e ~20 arquivos em `src/pages` e `src/components`.
- **Pendente:** conferir as telas que pedem login. Não subiu pra produção.

### 2026-10-30 — [empresa] — Cores padronizadas dentro das páginas
- **O que mudou:** botões de ação sólidos (azul, roxo, rosa, laranja, índigo, verde-água) viraram dourado (`bg-amber-600`); caixas e destaques roxos/rosa viraram dourado claro e os índigo viraram azul claro (guarda-corpo e portão continuam com cores diferentes entre si). Cartões brancos ficaram com canto mais arredondado e sombra leve. Verde (confirmar/pago) e vermelho (apagar/alerta) e as cores de status das colunas continuam iguais. 112 trocas em 16 arquivos, só classes de cor/borda/sombra — nenhuma função mudou.
- **Onde:** `CalculatorForm`, `ProposalOptions`, `Contract`, `ContractsList`, `ProductionQueuePage`, `DeliveriesTable`, `WeightCalculator(Page)`, `Carriers`, `CustomPaymentReceipt`, `SavedQuotes`, `GuardrailCalculator`, `ProductCatalog` e telas de visitas. Fora do padrão de propósito: 3D (`StaircaseVisualizer`), desenhos de guarda-corpo, Recibo de Instalação, impressão de pedido, proposta/orçamento técnico.
- **Pendente:** emojis dentro dos botões ainda existem (~150 linhas); usuário decidir se troca por ícones de linha. Não subiu pra produção.

### 2026-10-30 — [empresa] — Título padrão com ⓘ em todas as páginas
- **O que mudou:** novo componente `PageTitle` (título em caixa alta + ⓘ com explicação da página) aplicado em Gerar Contrato, Meus Contratos, Controle de Contratos, Recibo Pagamento, Visitas, Orçamentos Salvos, Fretes, Tabela de Entregas e nas 5 telas de Compras. Emojis dos títulos saíram. Abas da Central de Visitas no mesmo estilo das abas da Calculadora (ícone de linha + linha dourada + ⓘ). Nenhuma função mudou.
- **Onde:** `src/components/PageTitle.tsx` (novo), `src/pages/*.tsx`, `src/pages/Purchases/*.tsx`.
- **Pendente:** Recibo Instalação ficou com a faixa azul própria (não mexi). Conteúdo interno das páginas (cartões, botões coloridos) ainda no estilo antigo. Não subiu pra produção.

### 2026-10-30 — [empresa] — Visual novo: menu lateral, abas da Calculadora e informativos
- **O que mudou:** menu de cima virou menu lateral (grupos Contratos / Financeiro / Operações, ícones de linha, ⓘ com explicação em cada item; no celular abre pelo botão ☰). Abas da Central de Calculadoras com ícones de linha dourados e linha embaixo da aba ativa, cada uma com ⓘ. Caixa de Adendo de roxo pra dourado. Os ⓘ dos campos do formulário agora usam o mesmo componente `InfoTip` (funciona com toque no celular). Botão de tema ficou só no rodapé do menu. Corrigidos acentos quebrados ("Port�o") na tela de guarda-corpo e nos textos de contrato/aceite de obra de guarda-corpo avulso. Nenhuma função, rota ou cálculo mudou; o link morto "Custos" do menu do celular saiu (a rota não existe).
- **Onde:** `src/components/Layout.tsx`, `src/components/InfoTip.tsx` (novo), `src/pages/Calculator.tsx`, `src/components/CalculatorForm.tsx`, `src/components/GuardrailCalculator.tsx`, `src/utils/contractGenerator.ts`, `src/utils/aceiteObraGenerator.ts`.
- **Pendente:** usuário aprovar o visual; depois aplicar o mesmo padrão nas outras páginas (Meus Contratos, Tabela de Entregas etc.). Não subiu pra produção.

### 2026-10-30 — [empresa] — Criação do CLAUDE.md e deste diário
- **O que mudou:** criados `CLAUDE.md` (regras das duas máquinas, estado atual, pendências, estrutura) e `ATUALIZACOES.md`.
- **Onde:** raiz do repositório.
- **Pendente:** anotar a URL de produção do site no `CLAUDE.md`.

### 2026-10-30 — [empresa] — Buscador em Meus Contratos
- **O que mudou:** campo de busca no topo da página que filtra as 3 colunas por nome, CPF, e-mail, cidade ou endereço (ignora acento e maiúscula).
- **Onde:** `src/pages/ContractsList.tsx` (commit 805a497).
- **Pendente:** usuário testar no site.

### 2026-10-30 — [empresa] — Contrato saía com 0 degraus
- **O que mudou:** ao baixar contrato em Meus Contratos, degraus/altura/pisada/largura/comprimento agora são buscados em qualquer nível do JSON (igual à ficha técnica) e os patamares são descontados quando só existe o total. Caso relatado: Andréia (contrato com 0 degraus, ficha com 13).
- **Onde:** `src/pages/ContractsList.tsx` (`handleDownload`, commit 3ddbceb).
- **Pendente:** conferir o contrato da Andréia no site (não deu pra abrir o banco sem login).

### 2026-10-30 — [empresa] — Medidas de frete da escada fechada + 3D
- **O que mudou:** nova conta única `calcFoldedPackage` (degraus e corrimão "em pé" somam na largura pelo cosseno da inclinação e passam da viga pelo seno; pontas 37 cm; corrimão 80 cm sempre que o contrato tem corrimão; peso com dobradiças e corrimão). 3D redesenhado: viga em chapa, degrau com aba e 4 dobradiças, corrimão com 3 tubos e poucos postes.
- **Onde:** `src/utils/freightDimensions.ts`, `src/utils/technicalPdfGenerator.ts`, `src/components/StaircaseVisualizer.tsx`, `src/pages/Contract.tsx`, `src/pages/ContractsList.tsx` (commit 2623135).
- **Pendente:** fotos de perto pra deixar o 3D idêntico; peso real do Marco Peruchi pra calibrar o peso.

### 2026-10-30 — [empresa] — Texto da transportadora (cotação de frete)
- **O que mudou:** texto de cotação no formato da transportadora; botão "🚚 Frete" em Meus Contratos; na Tabela de Entregas a coluna FRETE (MEDIDAS) virou TRANSPORTADORA com texto editável, aviso "⚠️ FALTA INFORMAÇÃO" e botão Copiar (oculto na impressão). Dados do cliente buscados em todas as origens.
- **Onde:** `src/utils/freightQuoteText.ts`, `src/utils/clientInfo.ts`, `src/pages/DeliveriesTable.tsx`, `src/pages/ContractsList.tsx`, `src/pages/Contract.tsx`, `src/types.ts` (commits 87ad632 a 10abbf8).
- **Pendente:** "Modalidade de coleta" e "Tomador do frete" estão fixos até o usuário explicar como devem ser.

### 2026-10-30 — [empresa] — Limpeza da pasta antiga
- **O que mudou:** apagada a pasta aninhada antiga `calculadora-de-escadas`; o `.env` dela foi movido pra raiz do projeto (não versionado).
- **Onde:** só na máquina da empresa.
- **Pendente:** a máquina de casa precisa ter o próprio `.env` na raiz.
