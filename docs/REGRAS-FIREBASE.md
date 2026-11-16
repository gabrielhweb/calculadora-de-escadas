# Regras do Firebase — o que falta publicar

## Pra que serve

O Firebase só deixa o site ler e gravar uma "gaveta" do banco (coleção) se existir uma
**regra** liberando. As regras que estão publicadas hoje no Firebase não liberam duas gavetas:

| Coleção | O que guarda | O que acontece hoje |
|---|---|---|
| `saved_quotes` | Orçamentos salvos da Calculadora | A tela **Orçamentos Salvos** e a parte **Orçamentos** do Controle de Contratos ficam vazias, e a Tabela de Entregas não acha dados que só estão no orçamento |
| `settings` | Configurações de custo de **Compras** (preço do aço etc.) | O que é salvo em "Configurações Financeiras" de Compras não fica gravado |

O arquivo `firestore.rules` deste repositório já tem as duas regras. Só falta **publicar** no Firebase.

## Como fazer (2 minutos)

1. Entrar em https://console.firebase.google.com com a conta da Zilinski.
2. Abrir o projeto **gen-lang-client-0064759207**.
3. Menu da esquerda: **Firestore Database** → aba **Regras** (Rules).
4. Clicar no botão do Gemini (IA do Firebase) e colar o prompt abaixo.
   (Ou, sem IA: colar os dois blocos manualmente antes da última `}` do `match /databases/...` e clicar em **Publicar**.)

## Prompt pra colar na IA do Firebase

```
Nas regras do Cloud Firestore deste projeto, adicione as duas regras abaixo dentro de
"match /databases/{database}/documents", sem apagar nem alterar nenhuma regra que já existe.
Se a função isAllowedUser() não existir, crie ela assim:

function isAllowedUser() {
  return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

Regras para adicionar:

match /saved_quotes/{quoteId} {
  allow read, write: if isAllowedUser();
}
match /settings/{settingId} {
  allow read, write: if isAllowedUser();
}

Depois me mostre as regras completas para eu revisar antes de publicar.
```

5. Conferir que as regras antigas (`contracts`, `production_queue`, `transportadoras`, `state_prices`)
   continuam lá e clicar em **Publicar**.

## Como saber se deu certo

Abrir o site logado → **Orçamentos Salvos**: tem que aparecer a lista de orçamentos
(antes aparecia vazia). No Controle de Contratos, a seção "Orçamentos" deixa de mostrar "0 Tarefas".
