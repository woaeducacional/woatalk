# 🔐 Documentação - Página de Login (SignIn)

## 🎯 Visão Geral

A página de login do WOA Talk autentica usuários usando um sistema de **credenciais com NextAuth.js**. O usuário insere email e senha, que são validados contra o banco de dados usando bcrypt.

---

## 📂 Estrutura de Arquivos

```
app/
├── auth/
│   └── signin/
│       └── page.tsx               # Página principal de login
src/
└── components/ui/
    ├── Form.tsx                   # Componente base de formulário
    ├── Input.tsx                  # Campo de entrada
    ├── Button.tsx                 # Botão
    └── Card.tsx                   # Container de card
lib/
├── validation.ts                  # Schemas de validação (Zod)
├── db.ts                          # Funções de banco de dados
└── password.ts                    # Comparação de senhas
auth.ts (raiz)                     # Configuração NextAuth.js
app/api/auth/
└── [...nextauth]/route.ts         # Endpoints de autenticação NextAuth
```

---

## 🔄 Fluxo de Autenticação

### Visão Geral Completa

```
┌─────────────────────────┐
│  app/auth/signin        │
│     page.tsx            │
└────────────┬────────────┘
             │ Renderiza
             ↓
    ┌─────────────────┐
    │  SignInForm.tsx │
    │ (React Hook Form)
    └────────┬────────┘
             │ Submissão
             ↓
  ┌──────────────────────┐
  │ signIn('credentials')│
  │  (NextAuth)          │
  └────────┬─────────────┘
           │ POST
           ↓
┌──────────────────────────────┐
│ /api/auth/signin (NextAuth)  │
│ ├─ Valida credenciais        │
│ ├─ Busca usuário no BD       │
│ ├─ Compara senha com bcrypt  │
│ └─ CreateSession/JWT         │
└────────┬─────────────────────┘
         │
    ┌────┴─────────┐
    │              │
 Válido      Inválido
    │              │
    ↓              ↓
 Login      Erro no
Success     Formulário
```

---

## 📋 Página de Login

### Layout

```
┌──────────────────────────────────────────┐
│           🌊 WOA Talk                    │
│  Aprenda inglês em uma jornada épica    │
├──────────────────────────────────────────┤
│                                          │
│  ☐ Email      seu@email.com             │
│  ☐ Senha      ••••••••                  │
│                                          │
│           [Entrar]                       │
│                                          │
│  Não tem conta? Crie uma!                │
│                                          │
└──────────────────────────────────────────┘
```

**Arquivo:** [app/auth/signin/page.tsx](app/auth/signin/page.tsx)

```typescript
import { SignInForm } from '@/src/components/forms/SignInForm'

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-950 to-blue-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-100">🌊 WOA Talk</h1>
          <p className="text-blue-300">Aprenda inglês em uma jornada épica</p>
        </div>
        <SignInForm />
      </div>
    </main>
  )
}
```

**O que faz:**
- ✅ Renderiza layout responsivo
- ✅ Centraliza conteúdo
- ✅ Aplica tema gradiente
- ✅ Renderiza formulário SignInForm

---

## 📝 Formulário de Login

**Arquivo:** [src/components/forms/SignInForm.tsx](src/components/forms/SignInForm.tsx)

### Como Funciona

```typescript
export function SignInForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInInput) {
    setIsLoading(true)
    setError(null)

    try {
      // Usar signIn do NextAuth
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (!result?.ok) {
        setError('Email ou senha incorretos')
        return
      }

      // Redirecionar para dashboard após sucesso
      router.push('/dashboard')
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      {/* Campos de email e senha */}
      {/* Botão de envio */}
      {/* Link para criar conta */}
    </Form>
  )
}
```

### Campos do Formulário

#### Email

```typescript
<FormField
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="email"
          placeholder="seu@email.com"
          error={fieldState.error?.message}
        />
      </FormControl>
      <FormMessage>{fieldState.error?.message}</FormMessage>
    </FormItem>
  )}
/>
```

#### Senha

```typescript
<FormField
  name="password"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Senha</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="password"
          placeholder="••••••••"
          error={fieldState.error?.message}
        />
      </FormControl>
      <FormMessage>{fieldState.error?.message}</FormMessage>
    </FormItem>
  )}
/>
```

#### Botão

```typescript
<Button type="submit" className="w-full" loading={isLoading}>
  Entrar
</Button>
```

#### Link para SignUp

```typescript
<p className="text-center text-sm text-blue-300">
  Não tem uma conta?{' '}
  <a href="/auth/signup" className="text-orange-500 hover:text-orange-400">
    Crie uma!
  </a>
</p>
```

---

## ✅ Validações

**Arquivo:** [lib/validation.ts](lib/validation.ts)

```typescript
export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export type SignInInput = z.infer<typeof signInSchema>
```

**Validações aplicadas:**

| Campo | Validações |
|-------|-----------|
| **Email** | ✅ Formato de email válido |
| **Senha** | ✅ Não pode estar vazia (e mais na autenticação) |

**Quando valida:**
- ✅ Ao digitar (validação em tempo real)
- ✅ Ao submeter (validação completa)
- ✅ Mostra mensagens de erro

---

## 🔐 Autenticação NextAuth.js

### Configuração

**Arquivo:** [auth.ts](auth.ts) (na raiz do projeto)

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { signInSchema } from '@/lib/validation'
import { getUserByEmail } from '@/lib/db'
import { comparePasswords } from '@/lib/password'

declare module 'next-auth' {
  interface User {
    id?: string
  }
  interface Session {
    user: User & {
      id?: string
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // 1️⃣ Validar credenciais
          const { email, password } = await signInSchema.parseAsync(credentials)

          // 2️⃣ Buscar usuário no banco
          const user = await getUserByEmail(email)
          if (!user) {
            return null
          }

          // 3️⃣ Comparar senha
          const passwordMatch = await comparePasswords(password, user.password_hash)
          if (!passwordMatch) {
            return null
          }

          // 4️⃣ Retornar usuário
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
          }
        } catch (error) {
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    // JWT Callback
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // Session Callback
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
```

### Fluxo Passo a Passo

```
1. Usuário submenta formulário
   ↓
2. signIn('credentials', { email, password, redirect: false })
   ↓
3. NextAuth chama authorize() do provider Credentials
   ↓
4. Valida email e senha com Zod
   ↓
5. Busca usuário no banco de dados
   ↓
6. Compara senha com bcrypt
   ↓
7. Se tudo OK:
   ├─ Cria JWT token com ID do usuário
   ├─ Cria sessão segura
   └─ Retorna { ok: true }
   ↓
8. Formulário redireciona para /dashboard
```

---

## 🔑 Comparação de Senha

**Arquivo:** [lib/password.ts](lib/password.ts)

```typescript
import bcryptjs from 'bcryptjs'

export async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return await bcryptjs.compare(plain, hashed)
}
```

**Como funciona:**

```
Senha do usuário: "Senha123456"
Hash no BD:       "$2a$10$xyz..."

Processo:
1. bcryptjs.compare("Senha123456", "$2a$10$xyz...")
2. Extrai salt do hash
3. Hash a senha com o mesmo salt
4. Compara os hashes
5. Retorna true ou false
```

**⚠️ Importante:** Nunca armazena senha plana! Sempre usar bcrypt.

---

## ⚙️ Endpoints NextAuth

**Arquivo:** [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)

```typescript
import { handlers } from '@/auth' // Importa configuração

export const { GET, POST } = handlers
```

**Endpoints disponíveis:**

| Endpoint | Método | O que faz |
|----------|--------|----------|
| `/api/auth/signin` | POST | Autentica com credenciais |
| `/api/auth/callback/credentials` | POST | Callback após autenticação |
| `/api/auth/callback/[provider]` | POST | Callback de outros providers |
| `/api/auth/session` | GET | Retorna sessão atual |
| `/api/auth/csrf` | GET | Token CSRF para segurança |
| `/api/auth/signout` | POST | Faz logout |

---

## 📊 Banco de Dados

### Buscar Usuário

**Arquivo:** [lib/db.ts](lib/db.ts)

```typescript
export async function getUserByEmail(email: string): Promise<User | null> {
  // Usa Supabase se configurado, senão cai para in-memory DB
  if (useSupabase && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) return null
    return data
  } else {
    // Fallback para DB em memória
    return inMemoryDB.users.find(u => u.email === email) || null
  }
}
```

**Dados retornados:**

```typescript
{
  id: "uuid-1234",
  email: "usuario@example.com",
  name: "João Silva",
  password_hash: "$2a$10$...",
  avatar_url: null,
  xp_total: 0,
  coins_balance: 0,
  created_at: "2026-03-12T10:00:00Z",
  updated_at: "2026-03-12T10:00:00Z"
}
```

---

## 🛡️ Sessão e Autenticação

### Acessar Sessão no Componente

```typescript
import { useSession } from 'next-auth/react'

export function Dashboard() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Carregando...</div>
  if (status === 'unauthenticated') return <div>Não autenticado</div>

  return <div>Bem-vindo, {session?.user?.name}</div>
}
```

### Sessão No Servidor

```typescript
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  return Response.json({ userId: session.user.id })
}
```

---

## 🚪 Logout

Programaticamente:

```typescript
import { signOut } from 'next-auth/react'

<button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
  Sair
</button>
```

---

## ⚠️ Tratamento de Erros

### Erros Possíveis

| Erro | Causa | Mensagem |
|------|-------|---------|
| Email inválido | Formato errado | "Email inválido" |
| Senha vazia | Campo vazio | "Senha é obrigatória" |
| Usuário não existe | Email não cadastrado | "Email ou senha incorretos" |
| Senha errada | Dígitos incorretos | "Email ou senha incorretos" |
| Banco de dados | Erro na conexão | "Erro ao conectar ao servidor" |

**Propositalmente genéricos:** Não revelam se o email existe (segurança)

---

## 🧪 Testando Localmente

### Setup

```bash
npm run dev
```

### Teste 1: Login Válido

```
1. Ir para http://localhost:3000/auth/signin
2. Preencher:
   Email: seu_email_cadastrado@example.com
   Senha: SuaSenha123456
3. Clicar "Entrar"
4. Esperado: Redirecionado para /dashboard ✅
```

### Teste 2: Senha Incorreta

```
1. Ir para http://localhost:3000/auth/signin
2. Preencher:
   Email: seu_email_cadastrado@example.com
   Senha: SenhaErrada123456
3. Clicar "Entrar"
4. Esperado: Erro "Email ou senha incorretos" ❌
```

### Teste 3: Email Inexistente

```
1. Ir para http://localhost:3000/auth/signin
2. Preencher:
   Email: email_inexistente@example.com
   Senha: QualquerSenha123456
3. Clicar "Entrar"
4. Esperado: Erro "Email ou senha incorretos" ❌
```

### Teste 4: Email Inválido

```
1. Ir para http://localhost:3000/auth/signin
2. Preencher:
   Email: emailinvalido
   Senha: QualquerSenha123456
3. Clicar "Entrar"
4. Esperado: Erro "Email inválido" ❌
```

---

## 🔗 Fluxo Completo: Do SignUp ao Dashboard

```
Usuário Final
    │
    ├─ Novo usuário?
    │  └─ /auth/signup
    │      ├─ Preenche formulário
    │      ├─ Verifica email (OTP)
    │      └─ Redirecionado para /auth/signin?verified=true
    │
    └─ Usuário existente?
       └─ /auth/signin
           ├─ Preenche credenciais
           ├─ NextAuth valida e cria sessão
           ├─ Redirecionado para /dashboard
           └─ Sessão permanece ativa
               ├─ Refresh token (seguro)
               ├─ JWT armazenado (HTTP-only cookie)
               └─ Até fazer logout
```

---

## 🔒 Segurança

### Implementado

- ✅ Senhas hasheadas com bcrypt + salt
- ✅ Validação de email com Zod
- ✅ NextAuth.js (JWT + cookies HTTP-only)
- ✅ CSRF protection
- ✅ Mensagens de erro genéricas

### Não Implementado (Futuro)

- ❌ Rate limiting
- ❌ 2FA (autenticação de dois fatores)
- ❌ Recuperação de senha
- ❌ Logout em todos os dispositivos
- ❌ Detecção de atividade suspeita

---

## 🚀 Variáveis de Ambiente

**Arquivo:** `.env.local`

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_aleatorio_aqui

# Banco de dados (opcional)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email (opcional)
RESEND_API_KEY=...
```

---

## 📚 Componentes Reutilizáveis

### Form (React Hook Form + Zod)

[src/components/ui/Form.tsx](src/components/ui/Form.tsx)

```typescript
<Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
  <FormField name="email" render={...} />
</Form>
```

### Input

[src/components/ui/Input.tsx](src/components/ui/Input.tsx)

```typescript
<Input type="email" placeholder="seu@email.com" error={error} />
```

### Button

[src/components/ui/Button.tsx](src/components/ui/Button.tsx)

```typescript
<Button loading={isLoading} disabled={!form.formState.isValid}>
  Entrar
</Button>
```

### Card

[src/components/ui/Card.tsx](src/components/ui/Card.tsx)

```typescript
<Card>
  <CardHeader><CardTitle>Login</CardTitle></CardHeader>
  <CardContent>{...}</CardContent>
</Card>
```

---

## 💐 Providers

No projeto temos apenas **Credentials Provider** (email/senha).

Para adicionar outros, veja [NextAuth Providers](https://next-auth.js.org/providers/).

Exemplos:
- Google OAuth
- GitHub OAuth
- Facebook OAuth

---

## 📝 TypeScript

### User Type

```typescript
interface User {
  id: string
  email: string
  name: string
  password_hash: string
  avatar_url: string | null
  xp_total: number
  coins_balance: number
  current_phase: number
  errors_today: number
  last_error_reset: string
  created_at: string
  updated_at: string
}
```

### Session Type

```typescript
interface Session {
  user: User & {
    id?: string
  }
  expires: string
}
```

---

## 🔄 Próximas Melhorias

- [ ] "Lembrar-me" por 30 dias
- [ ] Recuperação de senha por email
- [ ] 2FA com Google Authenticator
- [ ] Logout global (todos os dispositivos)
- [ ] Rate limiting (máximo 5 tentativas)
- [ ] OAuth (Google, GitHub)
- [ ] Biometria (fingerprint, face ID)

---

## 📚 Arquivos Relacionados

- [LOGIN_PAGE.md](#) - Este arquivo
- [SIGNUP_PAGE.md](SIGNUP_PAGE.md) - Documentação de cadastro
- [EMAIL_VERIFICATION_GUIDE.md](../EMAIL_VERIFICATION_GUIDE.md) - Detalhes de OTP
- [../auth.ts](../auth.ts) - Configuração NextAuth
- [../lib/password.ts](../lib/password.ts) - Hash de senhas
