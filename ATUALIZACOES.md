# Atualizações

Registro do que cada máquina (empresa / casa) mudou no projeto. Ler antes de começar a trabalhar.

# Diário

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
