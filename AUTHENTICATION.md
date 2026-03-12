# 🔐 Estrutura de Autenticação - WOA Talk

## 📋 Visão Geral

Este documento descreve a estrutura completa de autenticação e cadastro implementada com Next.js, Auth.js, Supabase e Tailwind CSS.

---

## 🗂️ Estrutura de Diretórios

```
woatalk/
├── app/
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx           # Página de login
│   │   └── signup/
│   │       └── page.tsx           # Página de cadastro
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts       # Handler Auth.js
│   │       └── signup/
│   │           └── route.ts       # API de cadastro
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard protegido
│   ├── globals.css                # Estilos Tailwind
│   └── layout-new.tsx             # Layout com SessionProvider
├── src/
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx         # Componente de botão
│       │   ├── Input.tsx          # Componente de input
│       │   ├── Card.tsx           # Componente de card
│       │   └── Form.tsx           # Componente de formulário
│       └── forms/
│           └── SignUpForm.tsx     # Formulário de cadastro
├── lib/
│   ├── db.ts                      # Funções de banco de dados
│   ├── password.ts                # Hash e compare de senhas
│   ├── validation.ts              # Schemas Zod
│   ├── utils.ts                   # Utilitários (cn)
│   └── supabaseClient.ts          # Cliente Supabase (existente)
├── auth.ts                        # Configuração Auth.js
├── middleware.ts                  # Middleware para proteção
├── tailwind.config.ts             # Configuração Tailwind
├── postcss.config.js              # Configuração PostCSS
└── db/
    └── schema.sql                 # Schema do banco de dados
```

---

## 🔧 Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|------------|--------|----------|
| Next.js | 15.0.0 | Framework React full-stack |
| React | 19.0.0 | UI library |
| Auth.js | Latest | Autenticação |
| Supabase | 2.97.0 | Banco de dados PostgreSQL |
| Tailwind CSS | Latest | CSS framework |
| Zod | Latest | Validação de schema |
| React Hook Form | Latest | Gerenciamento de formulários |
| Bcryptjs | Latest | Hashing de senhas |

---

## 🔑 Como Funciona

### 1. **Cadastro (Sign Up)**

```
Usuário preenche formulário
        ↓
Validação com Zod (client-side)
        ↓
POST /api/auth/signup
        ↓
Verifica se email já existe
        ↓
Hash da senha com bcryptjs
        ↓
Salva no Supabase
        ↓
Redireciona para login
```

### 2. **Login (Sign In)**

```
Usuário preenche credenciais
        ↓
Validação com Zod (client-side)
        ↓
signIn('credentials') via Auth.js
        ↓
Chama authorize() em auth.ts
        ↓
Verifica email no banco
        ↓
Compara senha com bcryptjs
        ↓
Retorna user object
        ↓
Auth.js cria sessão
        ↓
Redireciona para /dashboard
```

### 3. **Proteção de Rotas**

Middleware verifica autenticação antes de acessar rotas protegidas:
- `/dashboard/*`
- `/api/protected/*`

---

## 📦 Dependências Instaladas

```json
{
  "next-auth": "v5",
  "zod": "^3.x",
  "bcryptjs": "^2.4.3",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_serviço

# Auth.js
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=gere_uma_string_aleatória_segura

# Para produção
# NEXTAUTH_URL=https://seu-dominio.com
```

**Para gerar AUTH_SECRET:**
```bash
npx auth-secret
```

---

## 🗄️ Schema do Banco de Dados

Execute o SQL em `db/schema.sql` no Supabase:

### Tabela `users`
```sql
id (UUID)              -- Identificador único
email (VARCHAR)        -- Email único
name (VARCHAR)         -- Nome completo
password_hash (VARCHAR)-- Senha hasheada
avatar_url (VARCHAR)   -- URL do avatar
xp_total (INTEGER)     -- XP total acumulado
coins_balance (INTEGER)-- Saldo de WOA Coins
current_phase (INTEGER)-- Fase atual
errors_today (INTEGER) -- Erros no dia
last_error_reset       -- Reset diário de erros
created_at             -- Data de criação
updated_at             -- Data de atualização
```

### Tabela `user_progress`
Rastreia progresso em lições e missões.

### Tabela `user_badges`
Armazena badges conquistadas (Coral, Explorer, Ocean Master).

---

## 🎨 Componentes UI

### Button
```tsx
<Button variant="default" size="lg" loading={isLoading}>
  Cadastrar
</Button>
```

### Input
```tsx
<Input 
  placeholder="Email" 
  type="email"
  error={errorMessage}
/>
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
```

### Form (com React Hook Form)
```tsx
<Form form={form} onSubmit={handleSubmit}>
  <FormField
    name="email"
    render={({ field, fieldState }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage>{fieldState.error?.message}</FormMessage>
      </FormItem>
    )}
  />
</Form>
```

---

## 🚀 Iniciar o Projeto

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# Executar migrations do Supabase (manual via dashboard)
# Cole o SQL de db/schema.sql no SQL Editor do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse:
- **Cadastro**: http://localhost:3000/auth/signup
- **Login**: http://localhost:3000/auth/signin
- **Dashboard**: http://localhost:3000/dashboard

---

## 🔒 Fluxo de Segurança

1. **Senhas**: Hasheadas com bcrypt (10 salt rounds)
2. **Sessões**: Gerenciadas por JWT via Auth.js
3. **CSRF**: Proteção automática do Auth.js
4. **Validação**: Dupla (client-side com Zod + server-side)
5. **Rate Limiting**: Implementar em produção (não incluído)
6. **HTTPS**: Obrigatório em produção
7. **AUTH_SECRET**: Gerado aleatoriamente (não committar)

---

## 📝 Próximos Passos

- [ ] Implementar rate limiting no signup/login
- [ ] Adicionar recovery/reset de senha
- [ ] Integrar OAuth (Google, GitHub)
- [ ] Adicionar verificação de email
- [ ] Implementar 2FA
- [ ] Criar dashboard completo com XP/Coins
- [ ] Sistema de lições e exercícios
- [ ] Gamificação (streaks, badges)

---

## 🐛 Troubleshooting

### "Cannot find module 'next-auth'"
```bash
npm install next-auth
```

### "Supabase connection error"
Verifique `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`

### "AUTH_SECRET is required"
Gere com: `npx auth-secret` e adicione em `.env.local`

### Sessão não persiste
- Verifique se `SessionProvider` envolve o app em `layout.tsx`
- Confirme se `NEXTAUTH_URL` é correto

---

## 📚 Referências

- [Auth.js Docs](https://authjs.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Validation](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)

---

**Última atualização**: Março 2026
**Status**: ✅ Pronto para desenvolvimento
