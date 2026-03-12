# 📝 Documentação - Página de Cadastro (SignUp)

## 🎯 Visão Geral

A página de cadastro do WOA Talk é uma experiência em **2 etapas**:
1. **Formulário de Cadastro** - Coleta dados do usuário (nome, email, senha)
2. **Verificação de Email** - Valida o email via código OTP de 6 dígitos

---

## 📂 Estrutura de Arquivos

```
app/
├── auth/
│   └── signup/
│       └── page.tsx              # Página principal
src/
├── components/
│   ├── forms/
│   │   ├── SignUpForm.tsx        # Formulário em 2 etapas
│   │   └── EmailVerification.tsx # Componente de verificação OTP
│   └── ui/
│       ├── Form.tsx              # Componente base de formulário
│       ├── Input.tsx             # Campo de entrada
│       ├── Button.tsx            # Botão
│       └── Card.tsx              # Container de card
lib/
├── validation.ts                 # Schemas de validação (Zod)
├── otp.ts                        # Gerenciador de OTP
├── email.ts                      # Envio de emails com Resend
├── db.ts                         # Funções de banco de dados
└── password.ts                   # Hash e validação de senhas
app/api/auth/
├── signup/route.ts               # Endpoint POST para criar usuário
├── send-code/route.ts            # Endpoint POST para enviar OTP
└── verify-code/route.ts          # Endpoint POST para validar OTP
```

---

## 🔄 Fluxo de Funcionamento

### Etapa 1: Página de Entrada

```
┌─────────────────────────┐
│    app/auth/signup      │
│      page.tsx           │
└────────────┬────────────┘
             │ Renderiza
             ↓
    ┌─────────────────┐
    │  SignUpForm.tsx │
    │  (Etapa: signup)│
    └─────────────────┘
```

**Arquivo:** [app/auth/signup/page.tsx](app/auth/signup/page.tsx)

```tsx
export default function SignUpPage() {
  return (
    <main className="...">
      <SignUpForm />
    </main>
  )
}
```

---

### Etapa 2: Formulário de Cadastro

```
┌──────────────────────────────────┐
│   SignUpForm.tsx (Etapa 1)       │
├──────────────────────────────────┤
│ ☐ Nome Completo                  │
│ ☐ Email                          │
│ ☐ Senha                          │
│ ☐ Confirmar Senha                │
│ [Criar Conta]                    │
└──────────────────────────────────┘
```

**Arquivo:** [src/components/forms/SignUpForm.tsx](src/components/forms/SignUpForm.tsx)

#### Como Funciona:

```typescript
export function SignUpForm() {
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [registeredEmail, setRegisteredEmail] = useState('')

  async function onSubmit(data: SignUpInput) {
    // 1. Envia dados para API
    const response = await fetch('/api/auth/signup', { ... })

    // 2. Salva email e muda etapa
    setRegisteredEmail(data.email)

    // 3. Envia código OTP automaticamente
    const codeResponse = await fetch('/api/auth/send-code', { ... })

    // 4. Muda para etapa de verificação
    setStep('verify')
  }

  // Renderiza diferente baseado na etapa
  return step === 'signup' ? <FormSignUp /> : <EmailVerification />
}
```

#### Validações (Zod):

**Arquivo:** [lib/validation.ts](lib/validation.ts)

```typescript
export const signUpSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Uma letra maiúscula')
    .regex(/[0-9]/, 'Um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não correspondem',
  path: ['confirmPassword'],
})
```

Fields validados:
- ✅ **Nome:** 2+ caracteres
- ✅ **Email:** Formato válido
- ✅ **Senha:** 8+ caracteres, maiúscula, número
- ✅ **Confirmação:** Deve corresponder

---

### Etapa 3: Envio do Código OTP

```
POST /api/auth/send-code
├─ Input: { email: "usuario@example.com" }
├─ Validações:
│  ├─ Email é válido?
│  ├─ Usuário existe?
│  └─ Há código pendente? (anti-spam)
├─ Gera: código OTP de 6 dígitos
├─ Armazena: em globalThis (memória)
├─ Envia: email com Resend
└─ Output: { message: "Código enviado com sucesso" }
```

**Arquivo:** [app/api/auth/send-code/route.ts](app/api/auth/send-code/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validatedData = await sendCodeSchema.parseAsync(body)

  // Verificar se usuário existe
  const User = await getUserByEmail(validatedData.email)
  if (!User) return 404

  // Verificar spam (código recente?)
  if (hasOTPPending(validatedData.email)) return 429

  // Gerar e armazenar código
  const code = generateOTP()
  storeOTP(validatedData.email, code)

  // Enviar email
  const emailResult = await sendOTPEmail(validatedData.email, code)
  if (!emailResult.success) return 500

  return { message: 'Código enviado com sucesso' }
}
```

**Funções Auxiliares:**

| Função | Localização | O que faz |
|--------|------------|----------|
| `generateOTP()` | `lib/otp.ts` | Gera número aleatório de 6 dígitos |
| `storeOTP()` | `lib/otp.ts` | Armazena código com expiração de 10min |
| `hasOTPPending()` | `lib/otp.ts` | Verifica se há código ativo |
| `sendOTPEmail()` | `lib/email.ts` | Envia email via Resend |
| `getUserByEmail()` | `lib/db.ts` | Busca usuário no banco |

---

### Etapa 4: Formulário de Criação de Usuário

Quando o usuário clica "Criar Conta":

```
POST /api/auth/signup
├─ Input: { name, email, password, confirmPassword }
├─ Validações:
│  ├─ Dados válidos? (Zod)
│  ├─ Email já existe?
│  └─ Senha forte?
├─ Hash: senha com bcryptjs
├─ Cria: novo usuário no banco
└─ Output: { user: { id, email, name } }
```

**Arquivo:** [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validatedData = await signUpSchema.parseAsync(body)

  // Verificar duplicatas
  const existingUser = await getUserByEmail(validatedData.email)
  if (existingUser) return { error: 'Email já registrado' }

  // Criar novo usuário
  const user = await createUser(
    validatedData.email,
    validatedData.name,
    validatedData.password  // Hash automático dentro de createUser
  )

  return { message: 'User created successfully', user }
}
```

**Funções Auxiliares:**

| Função | Localização | O que faz |
|--------|------------|----------|
| `createUser()` | `lib/db.ts` | Cria usuário com senha hasheada |
| `getUserByEmail()` | `lib/db.ts` | Busca usuário por email |
| `hashPassword()` | `lib/password.ts` | Hash bcrypt da senha |

---

### Etapa 5: Verificação do Email

```
┌──────────────────────────────────────────┐
│   EmailVerification.tsx (Etapa 2)        │
├──────────────────────────────────────────┤
│ 🌊 Verifique seu Email                   │
│ Enviamos um código para seu@email.com    │
│ [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]          │
│       [Verificar Código]                 │
│       [Reenviar código]                  │
│       [Voltar]                           │
└──────────────────────────────────────────┘
```

**Arquivo:** [src/components/forms/EmailVerification.tsx](src/components/forms/EmailVerification.tsx)

#### Como Funciona:

```typescript
export function EmailVerification({ email, onVerificationComplete }) {
  const [code, setCode] = useState(['', '', '', '', '', ''])

  async function handleVerify() {
    const fullCode = code.join('')

    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code: fullCode })
    })

    if (response.ok) {
      onVerificationComplete() // Redireciona para login
    }
  }

  return (
    <form>
      {/* 6 inputs individuais */}
      {code.map((digit, index) => (
        <input
          key={index}
          value={digit}
          maxLength={1}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </form>
  )
}
```

#### Recursos:

- ✅ Auto-foco entre campos
- ✅ Suporte a Backspace
- ✅ Validação de apenas números
- ✅ Reenvio com cooldown 60s
- ✅ Contador de tentativas

---

### Etapa 6: Verificação do Código OTP

```
POST /api/auth/verify-code
├─ Input: { email: "usuario@example.com", code: "123456" }
├─ Validações:
│  ├─ Email válido?
│  ├─ Código tem 6 dígitos?
│  └─ Código válido?
├─ Verificações:
│  ├─ Código existe no storage?
│  ├─ Não expirou? (10 minutos)
│  ├─ Tentativas < 5?
│  └─ Dígitos corretos?
├─ Sucesso:
│  ├─ Remove código do storage
│  └─ Marca email como verificado (futuro)
└─ Output: { message: "Email verificado com sucesso" }
```

**Arquivo:** [app/api/auth/verify-code/route.ts](app/api/auth/verify-code/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validatedData = await verifyEmailSchema.parseAsync(body)

  // Verificar OTP
  const otpResult = verifyOTP(validatedData.email, validatedData.code)

  if (!otpResult.valid) {
    return { error: otpResult.message, status: 400 }
  }

  // Marcar email como verificado (implementação futura)
  // await updateUser(user.id, { email_verified_at: new Date() })

  return { message: 'Email verificado com sucesso' }
}
```

**Funções Auxiliares:**

| Função | Localização | O que faz |
|--------|------------|----------|
| `verifyOTP()` | `lib/otp.ts` | Valida código OTP |
| `verifyEmailSchema` | `lib/validation.ts` | Valida formato do input |
| `getUserByEmail()` | `lib/db.ts` | Busca usuário para marcar verificado |

---

### Etapa 7: Redirecionamento

Após verificação bem-sucedida:

```
EmailVerification.tsx
  └─ onVerificationComplete()
      └─ router.push('/auth/signin?verified=true')
          └─ Página de Login
```

---

## 🔐 Fluxo de Segurança

```
1. Usuário digita senha
   ↓
2. Validação local (Zod) - mínimo 8 caracteres, maiúscula, número
   ↓
3. Envio para servidor (HTTPS in produção)
   ↓
4. Hash bcrypt com salt aleatório
   ↓
5. Armazenamento no banco (NÃO armazena senha plana!)
   ↓
6. Código OTP gerado (aleatório)
   ↓
7. Email enviado (Resend - HTTPS)
   ↓
8. Validação com 5 tentativas máximas
   ↓
9. Código deletado após uso
```

---

## 📊 Estado Global (globalThis)

O projeto usa `globalThis` para persistir dados entre hot reloads em desenvolvimento:

```typescript
// lib/otp.ts
const getOTPStorage = () => {
  if (!globalThis.otpStorage) {
    globalThis.otpStorage = {}
  }
  return globalThis.otpStorage
}
```

**⚠️ Importante:** Em produção (Vercel), usar Supabase ou Vercel KV!

---

## 📧 Integração com Resend (Email Real)

### Configuração:

1. Criar conta em [resend.com](https://resend.com)
2. Copiar API Key
3. Adicionar em `.env.local`:
   ```env
   RESEND_API_KEY=re_seu_token
   ```

### Fluxo de Email:

**Arquivo:** [lib/email.ts](lib/email.ts)

```typescript
export async function sendOTPEmail(email: string, code: string) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@resend.dev',
    to: email,
    subject: 'Seu código de verificação',
    html: `Código: <strong>${code}</strong>`
  })

  if (error) return { success: false, error: error.message }
  return { success: true, id: data?.id }
}
```

Email enviado:
```
De: noreply@resend.dev
Para: usuario@example.com
Assunto: Seu código de verificação WOA Talk - 10 minutos

🌊 Código de Verificação
Use este código para verificar sua conta:

669819

Este código expira em 10 minutos
```

---

## 🗄️ Banco de Dados

### Tabela: `users`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do usuário |
| `email` | VARCHAR | Email (unique) |
| `name` | VARCHAR | Nome completo |
| `password_hash` | VARCHAR | Senha hasheada com bcrypt |
| `avatar_url` | VARCHAR | URL do avatar (opcional) |
| `created_at` | TIMESTAMP | Data de criação |
| `email_verified_at` | TIMESTAMP | Quando email foi verificado (futuro) |

---

## ⚠️ Tratamento de Erros

### Erros Possíveis:

| Erro | Causa | Solução |
|------|-------|--------|
| `Email já está registrado` | Email em uso | Usar outro email |
| `Email inválido` | Formato errado | Verificar formato |
| `Senha deve ter pelo menos 8 caracteres` | Senha fraca | Aumentar comprimento |
| `Nenhum código enviado para este email` | Código não existe/expirou | Reenviar código |
| `Código inválido. 4 tentativa(s) restante(s)` | Dígitos errados | Reenviar e tentar novamente |
| `Muitas tentativas. Solicite um novo código` | 5 erros consecutivos | Reenviar código |
| `Código expirado` | Passou 10 minutos | Reenviar código |

---

## 🧪 Testando Localmente

### Setup:

```bash
git clone ...
cd woatalk
npm install
npm run dev
```

### Teste:

1. Abrir `http://localhost:3000/auth/signup`
2. Preencher:
   ```
   Nome: João Silva
   Email: teste@example.com
   Senha: Senha123456
   ```
3. Clicar "Criar Conta"
4. Código aparece no console do Node.js
5. Copiar e inserir nos 6 campos
6. Clicar "Verificar Código"
7. Redirecionado para login ✅

---

## 📝 Componentes Reutilizáveis

### Form

**Arquivo:** [src/components/ui/Form.tsx](src/components/ui/Form.tsx)

```typescript
<Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
  {/* Fields */}
</Form>
```

### Input

**Arquivo:** [src/components/ui/Input.tsx](src/components/ui/Input.tsx)

```typescript
<Input
  placeholder="seu@email.com"
  type="email"
  error={fieldState.error?.message}
/>
```

### Button

**Arquivo:** [src/components/ui/Button.tsx](src/components/ui/Button.tsx)

```typescript
<Button type="submit" loading={isLoading}>
  Criar Conta
</Button>
```

### Card

**Arquivo:** [src/components/ui/Card.tsx](src/components/ui/Card.tsx)

```typescript
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>{/* Conteúdo */}</CardContent>
</Card>
```

---

## 🚀 Próximas Melhorias

- [ ] Email verificado persistente no banco
- [ ] Resend templates customizados
- [ ] Rate limiting por IP
- [ ] Testes E2E com Cypress
- [ ] OAuth (Google, GitHub)
- [ ] Recuperação de senha

---

## 📚 Arquivos Relacionados

- [SIGNUP_PAGE.md](#) - Este arquivo
- [LOGIN_PAGE.md](LOGIN_PAGE.md) - Documentação de login
- [EMAIL_VERIFICATION_GUIDE.md](../EMAIL_VERIFICATION_GUIDE.md) - Detalhes de OTP
- [RESEND_SETUP.md](../RESEND_SETUP.md) - Configuração de email
