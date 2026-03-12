# 🚀 Quick Start - WOA Talk Authentication

## 📦 O que foi criado?

Uma estrutura **completa** de autenticação para o WOA Talk com:
- ✅ Sistema de cadastro com validação Zod
- ✅ Login com Auth.js + Credentials
- ✅ Hash de senhas com bcryptjs
- ✅ Componentes UI customizados (Tailwind)
- ✅ API routes de signup
- ✅ Dashboard protegido
- ✅ Schema SQL Supabase
- ✅ Middleware de proteção

---

## ⚡ 5 Passos para Começar

### 1. Criar Projeto Supabase
```bash
# Acesse https://supabase.com
# Crie novo projeto
# Copie as credenciais
```

### 2. Configurar Banco de Dados
```sql
# No SQL Editor do Supabase, execute:
# Abra: db/schema.sql
# Cole todo o conteúdo no SQL Editor
# Clique em "RUN"
```

### 3. Configurar Histórico Variáveis de Ambiente
```bash
# Crie arquivo .env.local na raiz
cp .env.example .env.local

# Preencha com as credenciais Supabase:
NEXT_PUBLIC_SUPABASE_URL=seu_url
SUPABASE_SERVICE_ROLE_KEY=sua_chave

# Gere AUTH_SECRET:
npm run gen-secret
# Copie o output e cole no .env.local
AUTH_SECRET=output_da_linha_anterior

# Para produção, use https
NEXTAUTH_URL=https://seu-dominio.com
```

### 4. Iniciar Servidor
```bash
npm run dev
```

### 5. Testar
```
Cadastro:  http://localhost:3000/auth/signup
Login:     http://localhost:3000/auth/signin
Dashboard: http://localhost:3000/dashboard
```

---

## 🧪 Teste Rápido

```javascript
// 1. Clique em "Cadastrar"
// 2. Preencha:
//    Nome: João Silva
//    Email: joao@example.com
//    Senha: Senha123
//    Confirmar: Senha123
// 3. Clique em "Criar Conta"
// 4. Você será redirecionado para login
// 5. Use credenciais para fazer login
// 6. Você será redirecionado para /dashboard
```

---

## 📂 Estrutura Principal

```
Autenticação:
├── /auth/signup       → Página de cadastro
├── /auth/signin       → Página de login
└── /api/auth/*        → Endpoints Auth.js

Protegido:
└── /dashboard         → Página restrita (precisa login)

Banco de Dados:
├── users              → Dados de usuários
├── user_progress      → Progresso em lições
├── user_badges        → Badges conquistadas
├── levels             → Níveis (oceanos)
└── phases             → Fases (aulas)
```

---

## 🔑 Variáveis Necessárias

| Variável | Origem | Onde Encontrar |
|----------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Dashboard → Settings → API |
| `AUTH_SECRET` | Gerado | `npm run gen-secret` |
| `NEXTAUTH_URL` | Local/Seu domínio | `http://localhost:3000` |

---

## 🎨 Customização Rápida

### Mudar Cores Oceânicas
```typescript
// tailwind.config.ts
colors: {
  ocean: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... customize aqui
  }
}
```

### Adicionar Campos no Cadastro
```typescript
// lib/validation.ts
export const signUpSchema = z.object({
  // ... adicione novos campos aqui
  age: z.number().min(13),
  country: z.string(),
})

// src/components/forms/SignUpForm.tsx
// Adicione FormField para cada novo campo
```

### Customizar Componentes
```bash
# Todos em:
src/components/ui/
├── Button.tsx    # Cores, tamanhos
├── Input.tsx     # Estilos de input
├── Card.tsx      # Card styling
└── Form.tsx      # Estrutura de formulário
```

---

## 🔒 Checklist de Segurança

Antes de ir para **produção**:

- [ ] Configurar variáveis de ambiente em produção
- [ ] Ativar HTTPS
- [ ] Implementar rate limiting
- [ ] Ativar email verification
- [ ] Ativar Row Level Security (RLS) no Supabase
- [ ] Adicionar CAPTCHA no signup
- [ ] Configurar CORS adequadamente
- [ ] Fazer backup do banco de dados

---

## 🚨 Erros Comuns

### "Cannot find module 'next-auth'"
```bash
npm install
npm run dev
```

### "Supabase connection error"
Verifique:
- `NEXT_PUBLIC_SUPABASE_URL` correto?
- `SUPABASE_SERVICE_ROLE_KEY` correto?
- Supabase project ativo?

### "AUTH_SECRET is required"
```bash
npm run gen-secret
# Adicione o output em .env.local
```

### Sessão não persiste
- SessionProvider envolve o app?
- AUTH_SECRET é o mesmo em .env.local?
- NEXTAUTH_URL é correto?

---

## 📊 O Que Vem Depois?

1. **Dashboard Completo**
   - Exibir XP/Coins reais
   - Mapa do oceano
   - Botão "Começar Jornada"

2. **Sistema de Lições**
   - Criar estrutura de aulas
   - Integrar exercícios
   - Rastrear progresso

3. **Gamificação**
   - Sistema de XP
   - WOA Coins
   - Streaks e Badges

4. **Recursos Avançados**
   - Voice recording
   - AI feedback
   - Multiplayer

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Documentação técnica completa
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Checklist detalhado
- [README.md](./README.md) - Visão geral do projeto

---

## 🐛 Precisa de Ajuda?

```bash
# Confira o status do projeto
npm run dev

# Veja console.log de erros
# Monitore em: http://localhost:3000

# Verifique Supabase logs
# Dashboard → Logs → Database
```

---

**Status**: ✅ Pronto para começar  
**Última atualização**: Março 2026  
**Tempo estimado para setup**: 15-20 minutos

🎉 **Bora começar a criar!**
