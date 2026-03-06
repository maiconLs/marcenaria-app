# 🪵 Marcenaria — Sistema de Gestão

Sistema web para gestão de serviços, orçamentos e fluxo de caixa da marcenaria.

## Stack
- **Next.js 14** (App Router)
- **Vercel KV** (banco de dados Redis, gratuito)
- **Tailwind CSS**

---

## 🚀 Deploy no Vercel (passo a passo)

### 1. Subir para o GitHub
```bash
cd marcenaria-app
npm install
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/marcenaria-app.git
git push -u origin main
```

### 2. Conectar no Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com o Google
2. Clique em **"Add New Project"**
3. Importe o repositório `marcenaria-app` do GitHub
4. Clique em **Deploy** — aguarde 1-2 minutos

### 3. Criar o banco de dados KV
1. No painel do projeto no Vercel, vá em **Storage**
2. Clique em **"Create Database" → KV**
3. Dê o nome `marcenaria-kv` e clique em Create
4. Clique em **"Connect to Project"** e selecione seu projeto
5. Vá em **Settings → Environment Variables** e confirme que as variáveis `KV_URL`, `KV_REST_API_URL` e `KV_REST_API_TOKEN` foram adicionadas automaticamente

### 4. Fazer redeploy
Após conectar o KV, vá em **Deployments → clique nos 3 pontos → Redeploy**

✅ Pronto! Você terá um link fixo tipo `marcenaria-app.vercel.app` para compartilhar com a equipe.

---

## Desenvolvimento local
```bash
npm install
# Crie um arquivo .env.local com as variáveis do Vercel KV (copie do painel)
npm run dev
```
