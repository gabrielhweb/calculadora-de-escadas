# Documentação da Funcionalidade: Tabela de Entregas

Esta documentação foi criada para guiar futuros desenvolvedores na manutenção da **Tabela de Entregas** (DeliveriesTable.tsx), que foi desenvolvida para substituir a antiga tabela feita em documento Word pela Zilinski Escadas.

## 1. Localização e Fluxo
- **Página Principal:** `src/pages/DeliveriesTable.tsx`
- **Rotas:** Acessível via `/tabela-entregas` (configurado em `src/App.tsx`).
- **Navegação:** O link encontra-se no menu superior/lateral em `src/components/Layout.tsx`.

## 2. Estrutura de Dados
A tabela lê e altera documentos na coleção `contracts` do **Firebase Firestore**. A interface TypeScript principal é a `SavedContract`, localizada em `src/types.ts`.

Para suportar o "painel de entregas", foram adicionados os seguintes campos opcionais à interface `SavedContract`:
```typescript
deliveryDate?: string;       // Data combinada de entrega (formato YYYY-MM-DD)
deliveryNotes?: string;      // Observações personalizadas do campo "Atenção"
hingesQty?: string;          // Quantidade de dobradiças customizadas
measurementsNotes?: string;  // Medidas ou anotações (ex: lado que vai fixado na parede)
```

## 3. Comportamento e Lógica (DeliveriesTable.tsx)

### A. Carregamento de Contratos
A tabela faz uma query buscando apenas os contratos em que `status == 'producao'`. Logo, ao ser marcado como "entregue", o contrato some desta lista e aparece apenas na aba correspondente do pipeline de "Meus Contratos" (`ContractsList.tsx`).

### B. Campos Editáveis (ContentEditable)
Para garantir que a tabela seja facilmente editável antes da impressão (como era no Word), usamos `divs` com a propriedade `contentEditable`.
Quando o usuário digita algo e sai do campo (evento `onBlur`), o sistema dispara um `updateDoc` no Firebase, salvando as informações em `deliveryNotes`, `hingesQty` ou `measurementsNotes`.

### C. Sistema de Calendário e Cores
O campo **Data de Entrega** exibe a data no formato `dd/mm/aaaa (dia da semana)` usando a biblioteca `date-fns`.
- A lógica de cores (`getDateColorClass`) verifica:
  - **Atrasado (Vermelho):** `isBefore(date, today)`
  - **Semana Atual (Laranja):** `isWithinInterval(date, { start: weekStart, end: weekEnd })`
  - **Futuro (Verde/Normal):** Qualquer outra data.

**Importante:** Um `<input type="date">` é renderizado logo abaixo do texto de exibição formatado. Este input fica invisível na hora da impressão (`className="print-hidden"`), mas garante total compatibilidade e funcionalidade para alterar a data pelo computador ou celular.

### D. Impressão Perfeita
O layout contém blocos de `@media print`.
Quando o botão "Imprimir Tabela" é acionado, as seguintes propriedades CSS forçam a impressão limpa:
- `size: landscape; margin: 10mm;` (Garante que a folha fique deitada)
- Oculta Navbar, Footer e botões (`.print-hidden`)
- Remove bordas azuis de edição interativa (`.editable-cell`) e exibe células lisas, garantindo formatação idêntica a tabelas tradicionais (Excel/Word).

## 4. Como Evoluir ou Alterar
- Se precisar adicionar uma nova coluna:
  1. Adicione a propriedade no `SavedContract` (`src/types.ts`).
  2. Adicione a tag `<th>` no cabeçalho da tabela.
  3. Adicione a `<td>` correspondente e vincule com o evento `onBlur` chamando `handleUpdateContract`.
- Se o Vercel apresentar problemas de build relacionados a datas, verifique se as bibliotecas `date-fns` e `date-fns-tz` estão instaladas via `npm install`.

## 5. Histórico de Atualizações Recentes (Log)
**Sincronização com Pipeline:**
- A ordem de classificação da Tabela de Entregas foi revertida para seguir a ordem exata da aba "Meus Contratos" (do mais recente ao mais antigo).
- A Data de Entrega escolhida na tabela agora aparece impressa em laranja no cartão do cliente na aba "Meus Contratos".

**Refinamento de Dados:**
- **Medidas:** O campo foi aprimorado e agora puxa automaticamente o local de fixação na parede (ex: "Fixação na Parede DIREITA"). O material "Metalon" foi alterado profissionalmente para "AÇO CARBONO". Além disso, todos os Itens Extras agora aparecem listados no final da coluna.
- **Atenção:** O aviso padrão de "COM CORRIMÃO" foi removido (já que é o padrão). Ele só será avisado se for selecionado "CORRIMÃO DOS DOIS LADOS". O tipo de material foi movido para a aba de Medidas.
- **Dobradiças:** O cálculo agora utiliza a mesma matemática da ficha de produção técnica do PDF.

*Última atualização: Julho de 2026 - Antigravity AI*
