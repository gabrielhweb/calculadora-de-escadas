# Atualizações

Registro do que cada máquina (empresa / casa) mudou no projeto. Ler antes de começar a trabalhar.

# Diário

### 2026-11-19 — [casa] — Impressão da Tabela de Entregas mais apertada + escolha da orientação — branch `impressao-folha`, NÃO publicado
- Pedido: no celular saíam só 2 contratos por folha, com muito espaço sobrando. Causas: a `.editable-cell` tinha `min-height: 40px` e padding também na impressão; o texto da transportadora e as colunas de fabricação (mono) saíam grandes; e o navegador pulava pra próxima folha quando o cliente não cabia inteiro.
- `src/pages/DeliveriesTable.tsx`, `@media print`: sem altura mínima nem padding na célula editável, textos longos em 9px, linhas podem continuar na folha seguinte (`break-inside: auto`), margem 8 mm. Simulado no site: as linhas ficaram de 30% a 40% mais baixas. Novo seletor **Folha deitada / Folha em pé** ao lado do Imprimir (lembrado no navegador, `localStorage` `entregas_orientacao`); em pé, no celular, imprime com largura 1000 em vez de 1400.
- Pendente: "pode subir" e testar imprimindo pelo celular. Acompanhar: não reconferido (sem publicar).

### 2026-11-19 — [casa] — Impressão da Tabela de Entregas pelo celular — publicado
- Pedido em áudio: imprimir a tabela pelo celular saía manchado/diferente do PC. Causa: o "Imprimir" usa o `window.print()` do navegador, que no celular monta a página na largura da tela (375 px). Aí a tabela fica espremida, cada cliente ocupa quase uma página e as colunas da direita somem. Além disso, o fundo cinza da `.of-plate` (estilo Oficina) saía impresso, porque a regra `html .of-plate` ganhava do `print:bg-white` e a página força `print-color-adjust: exact`.
- `src/pages/DeliveriesTable.tsx`: no celular o `handlePrint` troca a meta viewport pra `width=1400` antes de imprimir e volta no `afterprint`; no `@media print` a `.of-plate` fica branca e sem sombra. Simulado no navegador do app: em 1400 px cabem todas as colunas, com fundo branco.
- Publicado com o "pode subir" do usuário. Pendente: testar imprimindo pelo celular de verdade (Android e iPhone tratam o `afterprint` diferente; se a página ficar pequena depois de imprimir, é só recarregar). Acompanhar: não reconferido nesta entrada (casa conferiu em 17/11: ainda pendentes).

### 2026-11-18 — [empresa] — Publicado: cláusula 2.2 só com transportadora
- Usuário falou "pode subir": branch `clausula-2-2` juntado no `main` e publicado (detalhes na entrada abaixo). Branch apagado.
- **Pendente:** gerar de novo o contrato do Gustavo Storti; conferir um contrato novo com entrega nossa e um de transportadora.

### 2026-11-18 — [empresa] — Cláusula 2.2 só com transportadora (branch `clausula-2-2`, esperando "pode subir") + pendências
- **Contrato (`src/utils/contractGenerator.ts`):** pedido da Sofia — a cláusula "2.2 Entregar o objeto ... no prazo estabelecido na transportadora acordada pelas partes" agora só sai quando a Forma de Entrega é Transportadora (aí continua 2.2 + 2.2.1). Sem transportadora sai só "2.2 O objeto deverá ser entregue conforme as características descritas..." (o antigo 2.2.1 vira 2.2). Tirado o ". ." duplicado no fim. O cálculo de `isTransportadora` subiu pra antes da cláusula 2. Testado gerando o PDF local nos dois modos. **Está no branch `clausula-2-2`**, não no `main`.
- **Vídeo do Gustavo Storti:** é o caso do guarda-corpo em L que só mostrava 85 cm; o PDF do vídeo foi gerado antes da correção da máquina de casa (17/11). Testado local com guarda-corpo avulso em L 85 + 150: sai "Guarda-Corpo em L, composto por dois lados" com os dois lados. Falta só gerar de novo o contrato dele.
- **Pendências:** tirada a do `admins` (usuário cadastrou a 3ª conta: UID `On3F4M6baVb01C8g0fcceZtYJS62`). As 80 cantoneiras da NF 19773 do Jefferson eram de outro pedido: nada a fazer.
- **Acompanhar:** Beatriz, Hilton/Paulo Henrique e Bergamo — não reconferidos nesta entrada (casa conferiu em 17/11: ainda pendentes).
- **Pendente:** "pode subir" do branch `clausula-2-2`; depois juntar no `main`.

### 2026-11-17 — [casa] — Contrato: guarda-corpo avulso em L/U com todos os lados — publicado
- Pedido em vídeo (contrato do Gustavo Storti): orçamento saía "Guarda-corpo em L, composto por dois lados: 85 cm / 150 cm", mas o PDF do contrato só mostrava o 1º lado (85 cm).
- `src/utils/contractGenerator.ts` (lista de acessórios avulsos): com `guardrailFormat` L ou U agora escreve "Guarda-Corpo em L, composto por dois lados - Valor" e uma linha por lado. Formato normal continua igual.
- Publicado com o "pode subir" do usuário. Pendente: gerar de novo o contrato do Gustavo pra conferir. Acompanhar: igual à entrada da Conferência do Laser (mesmo dia).

### 2026-11-17 — [casa] — Conferência do Corte a Laser (nota do Jefferson) — publicado
- Nova tela **Compras → Conferência do Laser** (`/compras/conferencia`, `src/pages/Purchases/LaserInvoiceCheck.tsx`): sobe o PDF/foto da nota da Cia do Ferro (empresa do Jefferson), a IA lê (`readLaserInvoice` em `api/gemini.ts`, chamada com `invoiceBase64`), liga cada cliente da nota ao contrato pelo nome ("ESCADAS WAGNER FUIM / JAIR JOSÉ" → separa no "/") e cada peça à escada pela medida (`src/utils/laserInvoice.ts`). Mostra nota × conta do site por peça (vermelho acima de R$ 30), peça sem dono (ex.: cantoneiras), parcelas (= boletos) e salva em `settings/conferencia_jefferson` (lista de boletos a vencer e R$/kg de cada nota).
- Lógica descoberta: nº do boleto = nº da nota + parcela + total de parcelas (2008612 = NF 20086, 1 de 2). Jefferson cobra R$ 13,80/kg sobre um peso ~3,2% acima do teórico = R$ 14,24 no teórico.
- Conta mudada (`laserCutPieces` em `freightDimensions.ts`): degrau de **madeira** agora conta chapa de 3 mm (nota do Wagner); metal liso continua 2,65. Isso sobe o custo das escadas de madeira no Controle de Contratos quando publicar.
- Testado: conta bate com notas de Wagner, Jair e Cristiano (até R$ 5 por peça) e os 3 orçamentos antigos; IA leu as 2 notas certinho (rodando local com a chave do `.env`). Tela não testada logada (login não funciona em localhost).
- Publicado com o "pode subir" do usuário e testado no site logado com a NF 19773: IA leu pelo site, ligou Wagner e Jair aos contratos certos, diferença total -R$ 5,79 (Wagner) e -R$ 4,04 (Jair), cantoneiras R$ 300 em "Sem escada". Depois arrumei a lista de contratos (tinha duplicado por estar em `contracts` e `production_queue`; agora sem repetição e em ordem alfabética). Nada foi salvo em `settings/conferencia_jefferson` no teste.
- Acompanhar: Beatriz ainda pendente (Fila em "Contrato assinado"); Hilton e Paulo ainda sem data de entrega; Bergamo segue Concluído (recebimento não dá pra confirmar pelo site).
- Pendente: perguntar pro Jefferson das 80 cantoneiras L 60×25×150 (R$ 300) da NF 19773, que não estavam nos orçamentos.

### 2026-11-17 — [casa] — Conta do custo da escada igual à do Jefferson (corte a laser)
- **O que mudou:** o custo de matéria-prima da escada (Controle de Contratos → "Custos Base Calculadora" e o painel de estimativa do 3D) agora usa a regra do Jefferson: retângulo de cada chapa × espessura × 7,85 × **R$ 14,24/kg** (xadrez R$ 15,235/kg). Viga = (hipotenusa × degraus + 9 cm) × (linha azul + 12,9 cm), 3 mm; degrau = (pisante + 6) × largura, **2,65 mm** no metal e 3 mm na xadrez. Patamar continua pelo peso, agora a R$ 14,24/kg (antes R$ 13,80).
- **Por quê:** comparando com 3 orçamentos reais do Jefferson, a conta antiga errava até R$ 104 (Paulo +77,62, Hilton −16,10, Nilce +104,27). A nova erra Paulo −7,02, Hilton +1,66, Nilce +5,18.
- **Onde:** `src/utils/freightDimensions.ts` (`estimateLaserCutCost`, `STEEL_PRICE_PER_KG = 14.24`), `src/pages/ProductionQueuePage.tsx`. A Calculadora de Peso (`WeightCalculator.tsx`) continua com R$ 13,80 próprio.
- **Pendente:** usuário aprovou subir ("pode subir"). Calibrado com só 3 orçamentos, nenhum com patamar ou madeira: conferir com mais orçamentos. Tela de conferência Jefferson/boleto em Compras: esperando o usuário mandar um boleto de exemplo.
- **Acompanhar:** Hilton e Paulo Henrique continuam sem data de entrega na Tabela de Entregas (ainda pendente). Beatriz e Bergamo não conferidos hoje.

### 2026-11-16 — [empresa] — Aviso "conta não liberada no banco"
- **O que mudou:** quando alguém entra com e-mail autorizado mas sem documento na coleção `admins`, aparece no topo de todas as páginas um aviso amarelo com o e-mail da conta, o UID e botão "Copiar UID", explicando onde cadastrar (Firestore → Dados → `admins` → Adicionar documento). Detecta tentando ler 1 contrato e vendo se o Firestore responde `permission-denied`. Usuário aprovou subir ("pode colocar").
- **Por quê:** a Tabela de Entregas aparecia vazia numa conta e não dava pra saber qual conta faltava (o site não consegue ler a lista de usuários nem a coleção `admins`).
- **Onde:** `src/components/AdminAccessBanner.tsx` (novo), `src/components/Layout.tsx`.
- **Pendente:** usuário entrar com a conta que fica vazia, copiar o UID do aviso e criar o documento em `admins`.

### 2026-11-16 — [empresa] — Tabela de Entregas vazia em outra conta (diagnóstico)
- **Causa:** as regras do Firestore só liberam quem tem documento com o próprio UID na coleção `admins`. Lá só tem 2 documentos (um é gaguisilva15, `WSqKvTSG3HaelRBsFEsiaO1sGfD3`), mas `api/_auth.ts` autoriza 3 e-mails (zilinskidistribuidora, somarcilioz, gaguisilva15). A conta sem documento entra no site mas o banco devolve vazio (a Tabela de Entregas não mostra erro, só fica sem nada). Com a conta gaguisilva15 a tabela aparece completa (conferido).
- **Onde:** nada mudou no código; pendência nova no `CLAUDE.md`.
- **Pendente:** usuário criar o documento em `admins` com o UID da conta que está vazia.

### 2026-11-16 — [empresa] — Publicado: branch `melhorias-frete-email` juntado no `main` + regras do Firebase publicadas
- Usuário publicou as regras no Firebase (aba **Segurança** do Firestore, no console novo). Conferido no site logado: sumiram os erros "Missing or insufficient permissions" de `saved_quotes` e "Error fetching settings" de Compras. A seção "Orçamentos" da Fila continua com 0 porque a coleção `saved_quotes` está vazia (a tela Orçamentos Salvos guarda no próprio aparelho).
- Usuário mandou prosseguir: o branch abaixo foi juntado no `main` e publicado.
- **Testado no site depois do deploy:** perguntas "Como a escada chega na transportadora?" / "Quem paga o frete?" aparecem no Gerar Contrato ao escolher Transportadora. `/api/gemini` logado: Campinas→Itu 70,7 km / pedágio R$ 16,60 (3 s); Campinas→Goiânia 818,2 km / R$ 52,60 (2 s). Em produção a ferramenta Maps respondeu (a cota estourada era da chave do `.env` local); o plano B pelo OSRM fica pra quando ela falhar.
- **Acompanhar:** Beatriz, Hilton/Paulo Henrique e Bergamo — não reconferidos nesta entrada (ainda pendentes na conferência de hoje).
- **Pendente:** usuário testar as perguntas num contrato real de transportadora e o envio de e-mail da Fila.

### 2026-11-16 — [empresa] — Frete por IA mais confiável, perguntas de transportadora, e-mail e vite.config
- **vite.config.ts recriado:** só serve pra rodar no computador (`npm run dev` / preview "dev" do `.claude/launch.json`). Em modo dev define `process.env` como `{}` (senão a página fica branca); no build da Vercel não muda nada (conferido com `vite build`).
- **Perguntas de transportadora na página Gerar Contrato:** quando a Forma de Entrega é "Transportadora", aparecem "Como a escada chega na transportadora?" (padrão: nós levamos até a base / ou a transportadora busca na fábrica) e "Quem paga o frete?" (padrão: Zilinski-remetente / ou cliente-destinatário). Gravado em `inputData.logistics.freightPickup` / `freightPayer`; o texto da transportadora (`buildFreightQuoteText`) usa a resposta e, sem resposta, sai igual a antes. Usado no Contrato, Meus Contratos e Tabela de Entregas.
- **Frete por IA (`api/gemini.ts`):** causa da falha intermitente achada — a ferramenta Google Maps do Gemini responde **429 (cota excedida)**. Agora: (1) Gemini + Maps com tempo limite de 15 s, sem repetir se for cota; (2) se falhar, distância real pelo OSRM (CEP → ViaCEP → coordenadas no OpenStreetMap; CEP geral de cidade vai direto no OpenStreetMap) e só o pedágio estimado pelo Gemini (se o pedágio falhar, volta 0); (3) último recurso: estimativa só pela IA. Testado local com a chave do `.env`: Campinas→Itu 70,2 km; Campinas→São Paulo 109 km, pedágio R$ 13,90. O modelo `gemini-2.5-flash-lite` não está disponível pra essa chave (404), por isso não é usado.
- **E-mail (`api/email.ts`):** resposta do cliente agora vai pra comercialzilinski@gmail.com (antes o `reply_to` era o próprio cliente); aceita `EMAILJS_PRIVATE_KEY` opcional na Vercel; se o EmailJS recusar envio de servidor, a mensagem de erro diz qual opção ligar no painel do EmailJS. Envio real não testado (mandaria e-mail pra cliente).
- **Regras do Firebase:** o usuário já pegou o texto completo das regras (bate com o `firestore.rules`); falta colar e publicar no console.
- **Acompanhar:** Beatriz, Hilton/Paulo Henrique e Bergamo — não reconferido nesta entrada (conferido hoje mais cedo, ainda pendentes).
- **Onde:** `vite.config.ts` (novo), `api/gemini.ts`, `api/email.ts`, `src/utils/freightQuoteText.ts`, `src/pages/Contract.tsx`, `src/pages/ContractsList.tsx`, `src/pages/DeliveriesTable.tsx`.
- **Pendente:** "pode subir"; depois testar no site o frete por IA e as perguntas novas num contrato de transportadora. A conta do tubo do guarda-corpo ficou pra outro dia (usuário pediu).

### 2026-11-16 — [empresa] — Testes no site logado + regras do Firebase documentadas
- **Testado (site em produção, logado):** buscador de Meus Contratos ok (acha sem acento, por cidade e em maiúscula). Visual de Meus Contratos, Controle de Contratos e Compras ok. "Calcular melhor rota" (`/api/calcular-rota-diaria`) responde 200 usando OSRM (Google/Mapbox não configurados); a primeira e a última visita da lista ficam fixas (`source=first&destination=last`), só as do meio são reordenadas. Frete por IA (`/api/gemini`): pela tela deu 500 uma vez (~20 s, as duas tentativas falharam); chamado de novo direto respondeu 200 (98 km, R$ 22,40) — falha intermitente. Chave da IA do `.env` local funciona com `gemini-2.5-flash`. E-mail da Fila não testado (manda e-mail real).
- **Achado:** as regras publicadas no Firebase bloqueiam `saved_quotes` e `settings` (console: "Missing or insufficient permissions"). O `firestore.rules` do repositório já libera as duas; falta publicar. Criado `docs/REGRAS-FIREBASE.md` com explicação, passo a passo e prompt pra IA do Firebase.
- **Acompanhar:** Beatriz, Hilton/Paulo Henrique e Bergamo — conferidos hoje mais cedo, ainda pendentes.
- **Onde:** `docs/REGRAS-FIREBASE.md` (novo), `CLAUDE.md`. Nenhum código do site mudou.
- **Pendente:** usuário publicar as regras; se o frete por IA continuar falhando, ver os logs da função na Vercel (precisa login na Vercel).

### 2026-11-16 — [empresa] — Pendências reorganizadas
- **O que mudou:** a lista de Pendências do `CLAUDE.md` foi dividida em grupos. **🏠 Só na máquina de casa:** revogar o token antigo do GitHub (o Claude de casa deve lembrar até ser feito). **👀 Acompanhar:** Beatriz, Hilton/Paulo Henrique e Bergamo — quem resolve é o cliente; a cada entrada nova do Diário, conferir no site e anotar se resolveu (regra 5 atualizada). Saíram: contrato da Andréia (usuário conferiu, sai com 13 degraus) e peso do Marco Peruchi (pesos dos outros testes já batem). 3D: usuário vai conferir se já está parecido.
- **Acompanhar (conferido hoje no site):** Beatriz, Hilton/Paulo Henrique e Bergamo — ainda pendentes.
- **Onde:** `CLAUDE.md`.
- **Pendente:** nada novo.

### 2026-11-16 — [empresa] — Conferência dos contratos no site (só leitura)
- **O que foi visto (logado, Meus Contratos + Fila + Tabela de Entregas):** Chalita R$ 7.463,25, 11 degraus + patamar retrátil, corte a laser — ok, sem duplicata. Maria Helena R$ 7.251,35, 13 degraus, corte a laser, entrega 04/12 — ok, sem duplicata. Bergamo R$ 7.215,25, Entregue/Concluído, 100% pago — ok, sem duplicata. Hilton cadastrado (R$ 7.258,00, 14 degraus). Paulo Henrique aparece normal na Fila. Carla Polastro com 10 degraus (igual ao contrato salvo). Willian Alves Melgaço aparece 2x, mas são pedidos diferentes (R$ 2.055,30 em soldagem e R$ 5.595,50 concluído).
- **Fora do lugar:** Beatriz Grance Rinn "Falta assinar" em Meus Contratos × "Contrato assinado" na Fila; Hilton e Paulo Henrique sem data de entrega e sem CPF do destinatário no texto da transportadora.
- **Onde:** nada alterado no código nem no banco; só `CLAUDE.md` (pendências).
- **Pendente:** itens novos nas Pendências do usuário. Andréia continua sem conferir o PDF.

### 2026-11-11 — [casa] — Nova página Dashboard (/dashboard)
- **O que mudou:** página "Dashboard" no menu (abaixo de Calculadoras): escadas fechadas por mês com resumo mensal (igual ao gráfico manual que a equipe fazia), faturamento por mês, cartões do ano (fechadas, faturamento, ticket médio, em produção agora, falta assinar), material do pisante e seletor de ano. "Fechado" = status `producao` ou `entregue`, contado pelo mês do `createdAt` (aceita Timestamp, ISO e dd/mm/aaaa). Gráficos feitos com divs, sem biblioteca nova. Contas em `src/utils/dashboardStats.ts` (testadas com dados de exemplo).
- **Onde:** `src/pages/DashboardPage.tsx`, `src/utils/dashboardStats.ts`, `src/App.tsx`, `src/components/Layout.tsx`.
- **Pendente:** comparar com os números manuais da equipe (2026: Fev 10, Mar 13, Abr 2, Mai 13, Jun 11, Jul 17, Ago 8, Set 10, Out 14, Nov 4). Contratos cujo status voltou pra "falta assinar" ou foram apagados não contam.

### 2026-11-11 — [casa] — Contrato: um botão só, "Salvar e Gerar PDF"
- **O que mudou:** a pedido do usuário, "Salvar na Timeline" e "Gerar Contrato PDF" viraram um botão só, **"Salvar e Gerar PDF"** (na edição: "Salvar Alterações e Gerar PDF"): gera o PDF e grava no banco. Depois de salvo, clicar de novo só gera o PDF (não duplica). Saiu a pergunta "Salvar agora?" da entrada anterior. A validação agora é a do PDF (nome + endereço completo).
- **Onde:** `src/pages/Contract.tsx`.
- **Pendente:** cadastrar o contrato do Hilton (preencher pela tela; o CPF o usuário digita).

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
