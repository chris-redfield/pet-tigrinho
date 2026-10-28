# Aba Finanças: configurando a IA do Gemini

A aba **Finanças** tem um chat com um agente de IA (Google Gemini). O jogador
informa um valor e o agente sugere onde esse dinheiro pode render, com foco
em produtos do Banco do Brasil. Toda resposta lembra que aposta, cassino
online e bet **não são investimento**.

## Como funciona

```
navegador (src/js/ui/finance.js)
   │  POST /api/finance  { messages: [...] }
   ▼
server.js  ── lê GEMINI_API_KEY do .env
   │  POST generativelanguage.googleapis.com/.../{modelo}:generateContent
   ▼
Gemini  ──► resposta  ──► server.js  ──► navegador
```

**Por que existe um servidor?** A chave da API não pode ir para o navegador.
Qualquer pessoa que abrir o DevTools conseguiria copiá-la e usar a sua cota.
O `server.js` guarda a chave e fala com o Google em nome do app.

Arquivos:

| Arquivo | O que faz |
|---|---|
| `server.js` | Serve o jogo e expõe `POST /api/finance` |
| `server/gemini.js` | Prompt do agente, validação e formato do pedido e da resposta |
| `src/js/ui/finance.js` | Tela do chat, botões de valor e entrada por voz |
| `src/js/ui/tabbar.js` | Rodapé com as abas Pet e Finanças |
| `.env.example` | Modelo do arquivo de configuração |

## Passo a passo

### 1. Gere a chave da API

1. Acesse <https://aistudio.google.com/apikey> e entre com sua conta Google.
2. Clique em **Create API key** (Criar chave de API).
3. Escolha um projeto do Google Cloud ou deixe o AI Studio criar um.
4. Copie a chave, que começa com `AIza...`.

O AI Studio tem um nível gratuito com limite de pedidos por minuto e por dia.
Os limites mudam com o tempo; veja os atuais em **Usage & Billing** dentro do
AI Studio.

### 2. Crie o arquivo `.env`

Na pasta do projeto:

```bash
cp .env.example .env
```

Abra o `.env` e cole a chave:

```
GEMINI_API_KEY=AIza...sua-chave...
GEMINI_MODEL=gemini-3.6-flash
PORT=8000
```

O `.env` já está no `.gitignore`, então **nunca** vai para o GitHub. Não
tire ele de lá.

### 3. Rode o servidor

Precisa do Node.js 20.12 ou mais novo (`node --version`). O projeto não tem
dependências, então não precisa de `npm install`.

```bash
node server.js
```

O terminal deve mostrar:

```
[pet-tigrinho] http://localhost:8000
[gemini] modelos: gemini-3.6-flash → gemini-3.5-flash-lite → gemini-3.8-flash
```

Abra <http://localhost:8000>, toque em **Finanças** no rodapé e mande
"Tenho R$ 500".

### 4. (Opcional) Teste a chave direto na API

Lista os modelos que a sua chave pode usar:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models" -H "x-goog-api-key: SUA_CHAVE"
```

Se o modelo do `.env` não aparecer na lista, troque `GEMINI_MODEL` por um
que apareça.

## Proteja a chave

- **Restrinja a chave.** No [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
  abra a chave, vá em **API restrictions** e permita só a
  **Generative Language API**.
- **Se vazar, troque.** Apague a chave no AI Studio e gere outra.
- **Nunca** coloque a chave em arquivos dentro de `src/`, em commits ou
  em prints.

## Personalizando o agente

- **Comportamento:** edite `SYSTEM_PROMPT` em `server/gemini.js`. Ali
  estão o foco no Banco do Brasil, a regra contra apostas, os contatos de
  ajuda e o formato da resposta. Depois rode `node test/gemini.test.mjs`,
  porque os testes conferem que as regras essenciais continuam no prompt.
- **Modelo:** troque `GEMINI_MODEL` no `.env`. Se ele estiver sobrecarregado
  (erro 503), lento (mais de 20s) ou com limite estourado, o servidor tenta os
  de `GEMINI_FALLBACK_MODELS`, na ordem. O terminal mostra qual respondeu e
  em quanto tempo. Em outubro de 2026, o `gemini-3.6-flash` respondia em
  ~4s; o `gemini-3.8-flash`, mais novo, vivia sobrecarregado.
- **Raciocínio:** os modelos Gemini 3 "pensam" antes de responder, e isso
  deixa tudo mais lento e consome o limite de tokens. O nível fica em
  `THINKING` / `thinkingLevel` em `server/gemini.js`: "minimal" por padrão,
  "low" no `3.8-flash`, que não aceita "minimal"
- **Criatividade:** `temperature` em `buildRequest` (0.4 hoje). Valores
  mais baixos deixam a resposta mais previsível.
- **Limites:** `LIMITS` em `server/gemini.js` (mensagens por pedido e
  tamanho de cada uma) e `rateLimited` em `server.js` (pedidos por minuto).

## Privacidade

- O histórico do chat fica só na memória da página. Nada é salvo, e
  recarregar a página apaga a conversa.
- Mesmo assim, o texto vai para o Google. No nível gratuito, o Google
  pode usar os dados para melhorar os produtos. Confira os termos do Gemini
  API e não use dados pessoais reais nos testes.
- O agente é instruído a nunca pedir senha, CPF ou número de conta.

## Publicando o protótipo para teste

O GitHub Pages só hospeda arquivos estáticos e **não roda o `server.js`**.
Lá o jogo funciona, mas a aba Finanças mostra "Sem conexão com o servidor".
Para a IA funcionar, o `server.js` precisa rodar em algum lugar. Há dois
caminhos:

| | Opção A: túnel do seu PC | Opção B: Render |
|---|---|---|
| Serve para | Uma sessão de teste agora, poucas pessoas | Link fixo por dias ou semanas |
| Custo | Grátis | Plano gratuito |
| Fica no ar | Só enquanto seu PC e o terminal estiverem ligados | Sempre (dorme sem uso e acorda em ~1 min) |
| HTTPS (pedômetro no celular) | Sim | Sim |

### Opção A: túnel do seu PC (5 minutos)

1. Instale o cloudflared (uma vez só):
   ```bash
   winget install --id Cloudflare.cloudflared
   ```
2. Rode o jogo normalmente:
   ```bash
   node server.js
   ```
3. Em **outro** terminal, abra o túnel:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
4. Ele mostra um link `https://algo-aleatorio.trycloudflare.com`. Mande esse
   link para os testadores. O link muda a cada vez que você abre o túnel.

No `.env`, use `TRUST_PROXY=1` para o limite valer por testador.

### Opção B: Render (link fixo)

1. Faça commit e push do projeto para o GitHub. O `.env` **não** vai junto,
   e é assim mesmo.
2. Crie uma conta em <https://render.com> entrando com o GitHub.
3. Clique em **New → Web Service** e escolha o repositório `pet-tigrinho`.
4. Preencha:
   - **Branch:** a que você quer publicar (por exemplo `main`)
   - **Runtime:** Node
   - **Build Command:** deixe vazio. Se o Render exigir algo, use `npm install`,
     que não instala nada porque o projeto não tem dependências.
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Em **Environment Variables**, adicione:
   - `GEMINI_API_KEY` = sua chave
   - `TRUST_PROXY` = `1`
   - `DAILY_LIMIT` = `300` (ou o teto que preferir)

   Não precisa de `PORT`, porque o Render define sozinho.
6. Clique em **Create Web Service**. Em alguns minutos sai um link
   `https://pet-tigrinho.onrender.com`. Mande esse link para os testadores.

A cada push na branch escolhida, o Render publica de novo sozinho.

### Antes de mandar o link

- **Proteja o gasto.** Com chave do nível gratuito, o pior que acontece é o
  chat parar ao bater a cota. Se ativar cobrança no Google Cloud, crie um
  **alerta de orçamento** em Billing → Budgets & alerts. O `DAILY_LIMIT`
  também é um teto: passou dele, o chat pede para voltar amanhã.
- **Restrinja a chave** à Generative Language API (veja "Proteja a chave").
- **Avise os testadores** de que o chat usa IA do Google e que não devem
  digitar dados pessoais. No nível gratuito, o Google pode usar as
  conversas para melhorar os produtos.
- **Teste o link do celular** antes de enviar: aba Finanças → R$ 100.

### Outra opção: função serverless

Se quiser manter o jogo no GitHub Pages e só a IA fora, dá para usar uma
função serverless (Cloudflare Workers, Vercel, Netlify Functions). Copie a
lógica de `financeChat` do `server.js`, reaproveite `server/gemini.js` e
aponte o `fetch('api/finance')` de `finance.js` para a URL da função
(liberando CORS para o domínio do Pages). Dá mais trabalho, por isso a
opção B é a recomendada para o protótipo.

Em qualquer opção, a chave fica no servidor, nunca no front-end.

## Problemas comuns

| Mensagem no chat | Causa provável | O que fazer |
|---|---|---|
| "A IA ainda não foi configurada" | `.env` sem `GEMINI_API_KEY` | Refaça o passo 2 e reinicie o servidor |
| "Sem conexão com o servidor" | Abriu com `python -m http.server` ou GitHub Pages | Rode `node server.js` |
| "A IA não respondeu agora" | Chave inválida ou modelo inexistente | Veja o erro `[gemini]` no terminal |
| "A IA está sobrecarregada agora" / "demorou demais" | Todos os modelos da lista falharam (demanda alta no Google) | Tente de novo em alguns minutos ou ponha outros modelos em `GEMINI_FALLBACK_MODELS` |
| "Muitas perguntas seguidas" | Limite de 15 por minuto por pessoa | Espere um minuto. Se acontecer com todos ao mesmo tempo no servidor publicado, falta `TRUST_PROXY=1` |
| "O chat atingiu o limite de hoje" | Passou do `DAILY_LIMIT` | Aumente o valor ou espere o dia virar (meia-noite UTC) |
