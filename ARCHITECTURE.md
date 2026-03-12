# 🏗️ Arquitetura de Autenticação - WOA Talk

## 🎯 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                      WOA TALK APP                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │  Usuário (Web)   │         │  Usuário Mobile  │           │
│  └────────┬─────────┘         └────────┬─────────┘           │
│           │                           │                      │
│           └───────────────┬───────────┘                      │
│                           │                                  │
│                  ┌────────▼─────────┐                        │
│                  │   Next.js App    │                        │
│                  │  (React 19 + TS) │                        │
│                  └────────┬─────────┘                        │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────┐        │
│  │                        │                        │        │
│  ▼                        ▼                        ▼        │
│  Routes              API Routes               Auth          │
│  ├─ /auth/signup    ├─ POST /signup   ├─ auth.ts          │
│  ├─ /auth/signin    ├─ POST /signin   └─ middleware.ts    │
│  └─ /dashboard      └─ GET  /session                       │
│                                                             │
└────────────────────┬──────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌───────────┐         ┌──────────────────┐
   │ Supabase  │         │ Next.js Runtime  │
   ├───────────┤         ├──────────────────┤
   │ DB        │         │ Auth.js Session  │
   │ - users   │         │ - JWT Token      │
   │ - progress│         │ - User Data      │
   │ - badges  │         │ - Middleware     │
   │ - phases  │         │                  │
   └───────────┘         └──────────────────┘
```

---

## 📊 Fluxo de Autenticação

```
CADASTRO (Sign Up)
═══════════════════

Usuário          Navegador          API              Supabase
   │                 │               │                   │
   ├─ Preenche Form──→│               │                   │
   │                 │               │                   │
   │               [Zod Validation]  │                   │
   │                 │               │                   │
   │                 ├─ POST /signup─→│                   │
   │                 │               │                   │
   │                 │               ├─[Duplicate Check]─→
   │                 │               │←─ ok/duplicate ────┤
   │                 │               │                   │
   │                 │               ├─[Hash Password]   │
   │                 │               │                   │
   │                 │               ├─ INSERT user ────→│
   │                 │               │←─ user_id ────────┤
   │                 │←─ 201/201 error               │
   │                 │               │                   │
   │             Redirect to Login   │                   │
   │                 │               │                   │


LOGIN (Sign In)
═══════════════

Usuário          Navegador          Auth.js          Supabase
   │                 │               │                   │
   ├─ Preenche Form──→│               │                   │
   │                 │               │                   │
   │               [Zod Validation]  │                   │
   │                 │               │                   │
   │                 ├─ signIn() ────→│                   │
   │                 │               │                   │
   │                 │               ├─ authorize() ────→
   │                 │               │                   │
   │                 │               ├─ SELECT user ────→
   │                 │               │←─ user data ──────┤
   │                 │               │                   │
   │                 │               ├─ [Compare Pwd]   │
   │                 │               │                   │
   │                 │               ├─ CREATE JWT ──────┐
   │                 │               │                   │
   │                 │←─ session ────────────────────────┤
   │                 │               │                   │
   │             Redirect /dashboard │                   │
   │                 │               │                   │


ACESSO PROTEGIDO
═════════════════

Usuário          Navegador          Middleware       Dashboard
   │                 │               │                   │
   ├─ Acessa /dash ──→│               │                   │
   │                 │               │                   │
   │                 ├─ Verifica JWT─→│                   │
   │                 │               │                   │
   │                 │               ├─ Valida token    │
   │                 │               │                   │
   │                 │←─ ok ─────────┤                   │
   │                 │                                   │
   │                 ├──────── Carrega /dashboard ──────→│
   │                 │←────── Mostra dashboard ────────│
   │                 │                                   │
   │             [Dashboard Renderizado]                │
   │                 │                                   │
```

---

## 🔐 Camadas de Segurança

```
┌──────────────────────────────────────────────────────────┐
│ 1. VALIDAÇÃO FRONTEND (Zod)                               │
│    └─ Type checking, format validation, required fields  │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 2. HASHING (bcryptjs)                                     │
│    └─ Senha → Hash (não reverter)                        │
│    └─ 10 salt rounds para segurança                      │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 3. VALIDAÇÃO BACKEND (Zod novamente)                      │
│    └─ Não confiar no cliente                             │
│    └─ Validação server-side obrigatória                  │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 4. BANCO DE DADOS (Supabase + RLS)                        │
│    └─ Row Level Security policies                        │
│    └─ Usuários veem apenas seus dados                    │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 5. SESSÃO (Auth.js + JWT)                                │
│    └─ Token assinado digitalmente                        │
│    └─ Verificação em cada request                        │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 6. MIDDLEWARE (NextAuth)                                  │
│    └─ Proteção de rotas                                  │
│    └─ Redireciona não autenticados                       │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 7. HTTPS (Produção)                                       │
│    └─ Encriptação de dados em trânsito                   │
│    └─ Obrigatório para dados sensíveis                   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
woatalk/
│
├─ app/                          # Next.js 13+ App Router
│  ├─ auth/
│  │  ├─ signin/page.tsx         # Login page
│  │  └─ signup/page.tsx         # Signup page
│  │
│  ├─ api/
│  │  └─ auth/
│  │     ├─ [...nextauth]/       # Auth.js API route
│  │     └─ signup/              # Signup API
│  │
│  ├─ dashboard/
│  │  └─ page.tsx                # Protected dashboard
│  │
│  ├─ globals.css                # Global Tailwind styles
│  └─ layout-new.tsx             # Root layout with SessionProvider
│
├─ src/                          # Source code
│  └─ components/
│     ├─ ui/                     # UI Components
│     │  ├─ Button.tsx
│     │  ├─ Input.tsx
│     │  ├─ Card.tsx
│     │  └─ Form.tsx
│     │
│     └─ forms/
│        └─ SignUpForm.tsx       # Signup form component
│
├─ lib/                          # Utilities & Business Logic
│  ├─ validation.ts              # Zod schemas
│  ├─ password.ts                # bcryptjs wrappers
│  ├─ db.ts                      # Supabase queries
│  ├─ utils.ts                   # Tailwind merge
│  └─ supabaseClient.ts          # Supabase client instance
│
├─ db/
│  └─ schema.sql                 # PostgreSQL schema
│
├─ auth.ts                       # Auth.js configuration
├─ middleware.ts                 # NextAuth middleware
│
├─ tailwind.config.ts            # Tailwind configuration
├─ postcss.config.js             # PostCSS configuration
├─ tsconfig.json                 # TypeScript config
├─ next.config.js                # Next.js config
│
├─ package.json                  # Dependencies
├─ .env.example                  # Environment vars template
├─ .gitignore
│
└─ DOCS/
   ├─ README.md                  # Project overview
   ├─ AUTHENTICATION.md          # Auth documentation
   ├─ QUICK_START.md            # Quick start guide
   ├─ SETUP_CHECKLIST.md        # Setup checklist
   ├─ FILE_MAP.md               # File structure (this)
   └─ COMMANDS.md               # Useful commands
```

---

## 🔄 Component Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ SignUpForm.tsx (Client Component)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  State:                                                 │
│  ├─ formData (email, password, etc)                     │
│  ├─ isLoading (boolean)                                 │
│  └─ error (string | null)                              │
│                                                         │
│  useForm() → useController() → Field Values             │
│       │                                                 │
│       └──→ Zod Validation Schema                        │
│            └──→ signUpSchema.parse()                    │
│                                                         │
│  onSubmit():                                            │
│  ├─ validates with Zod                                 │
│  ├─ POST to /api/auth/signup                           │
│  └─ handle response (redirect or error)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         │ POST /api/auth/signup
         ▼
┌─────────────────────────────────────────────────────────┐
│ app/api/auth/signup/route.ts (Server)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Parse request body                                  │
│  2. Validate with Zod (signUpSchema)                    │
│  3. Check duplicate email (getUserByEmail)             │
│  4. Hash password (hashPassword)                        │
│  5. Create user in DB (createUser)                      │
│  6. Return response (201 or error)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         │ API calls
         ▼
┌─────────────────────────────────────────────────────────┐
│ lib/db.ts (Supabase Queries)                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  createUser():                                          │
│  ├─ Call hashPassword()                                 │
│  └─ INSERT into users table                             │
│                                                         │
│  getUserByEmail():                                      │
│  └─ SELECT * FROM users WHERE email = ?                │
│                                                         │
│  comparePasswords():                                    │
│  └─ Use bcryptjs to compare                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         │ SQL queries
         ▼
┌─────────────────────────────────────────────────────────┐
│ Supabase PostgreSQL                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  users table:                                           │
│  ├─ id (UUID)                                           │
│  ├─ email (string, unique)                              │
│  ├─ password_hash (string)                              │
│  ├─ name (string)                                       │
│  ├─ xp_total (integer)                                  │
│  ├─ coins_balance (integer)                             │
│  └─ created_at (timestamp)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Estado da Sessão

```
LOGIN
  │
  ├─ auth.ts authorize() returns user object
  │  │
  │  └─ Auth.js creates JWT token
  │
  ├─ SessionProvider wraps app
  │  │
  │  └─ useSession() hook available to components
  │
  ├─ session object contains:
  │  ├─ user.id
  │  ├─ user.email
  │  ├─ user.name
  │  └─ expires (token expiration)
  │
  └─ Middleware checks token on protected routes
     │
     └─ Redirects to /auth/signin if invalid


LOGOUT
  │
  ├─ signOut() removes session
  │
  ├─ SessionProvider updates state
  │
  ├─ useSession() returns status: 'unauthenticated'
  │
  └─ Middleware redirects to login
```

---

## 📈 Escalabilidade

### Agora (MVP)
- ✅ Local authentication (email + password)
- ✅ Single user per email
- ✅ Simple session management
- ✅ Supabase hosted DB

### Próximo (v1.0)
- 🔄 Email verification
- 🔄 Password reset
- 🔄 Rate limiting
- 🔄 Audit logs

### Futuro (v2.0+)
- 📱 OAuth providers
- 🔐 2FA/MFA
- 👥 Social login
- 🌐 Multi-tenant support
- 📊 Analytics integration

---

## 🚀 Deployment Strategy

```
Local Development
    │
    └─→ .env.local (secrets)
        │
        ├─→ npm run dev
        │   └─ http://localhost:3000
        │
        └─→ Test/Develop
            │
            └─→ Commit to feat/cadastro


Staging (Optional)
    │
    └─→ Deploy to Vercel preview
        │
        ├─→ Environment: staging
        │
        └─→ Test with real Supabase staging DB


Production
    │
    └─→ Merge to main
        │
        ├─→ Deploy to Vercel production
        │
        ├─→ Environment: production
        │
        ├─→ .env.production with prod secrets
        │
        └─→ https://seu-dominio.com
```

---

## 🎓 Fluxo de Aprendizado

Para entender o projeto, leia nesta ordem:

1. **Este arquivo** - Entender a arquitetura geral
2. **auth.ts** - Configuração Auth.js
3. **lib/validation.ts** - Schemas Zod
4. **src/components/forms/SignUpForm.tsx** - Formulário cliente
5. **app/api/auth/signup/route.ts** - Endpoint servidor
6. **lib/db.ts** - Banco de dados
7. **middleware.ts** - Proteção de rotas
8. **app/dashboard/page.tsx** - Rota protegida

---

**Status**: ✅ Completo e funcional  
**Última atualização**: Março 2026  
**Versão da arquitetura**: 1.0.0
