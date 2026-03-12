# Sistema de Validação de Email com OTP

## 🎯 Visão Geral

Sistema de validação de email após cadastro usando One-Time Password (OTP) - código de 6 dígitos válido por 10 minutos.

## 📋 Fluxo de Funcionamento

1. **Usuário cadastra** → Nome, Email, Senha
2. **Sistema cria usuário** → Armazena dados no banco
3. **Sistema envia código OTP** → Gera código de 6 dígitos
4. **Usuário insere código** → Verifica no campo OTP
5. **Email validado** → Redireciona para login

## 🔧 Componentes Implementados

### 1. **lib/otp.ts**
Gerencia geração, armazenamento e verificação de códigos OTP.

```typescript
// Gerar código OTP de 6 dígitos
const code = generateOTP()

// Armazenar código (válido por 10 minutos)
storeOTP(email, code)

// Verificar código
const result = verifyOTP(email, userCode)
```

**Recursos:**
- Código de 6 dígitos aleatórios
- Expiração em 10 minutos
- Limite de 5 tentativas
- Armazenamento em memória (adaptar para DB em produção)

### 2. **lib/validation.ts**
Schemas de validação para OTP e envio de códigos.

```typescript
// Verificar email
export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
})

// Solicitar código
export const sendCodeSchema = z.object({
  email: z.string().email()
})
```

### 3. **app/api/auth/send-code/route.ts**
Endpoint POST para gerar e enviar código OTP.

```bash
# Requisição
POST /api/auth/send-code
{
  "email": "usuario@example.com"
}

# Resposta (sucesso)
{
  "message": "Código enviado com sucesso",
  "email": "usuario@example.com",
  "debug": { "code": "123456" } // Apenas em desenvolvimento
}

# Resposta (erro)
{
  "error": "Um código já foi enviado recentemente. Aguarde alguns minutos."
}
```

### 4. **app/api/auth/verify-code/route.ts**
Endpoint POST para verificar código OTP.

```bash
# Requisição
POST /api/auth/verify-code
{
  "email": "usuario@example.com",
  "code": "123456"
}

# Resposta (sucesso)
{
  "message": "Email verificado com sucesso",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário"
  }
}

# Resposta (erro)
{
  "error": "Código inválido. 4 tentativa(s) restante(s)"
}
```

### 5. **src/components/forms/EmailVerification.tsx**
Componente React para entrada do código OTP.

**Recursos:**
- 6 inputs individuais para cada dígito
- Auto-foco entre campos
- Suporte a Backspace
- Reenvio de código com cooldown de 60s
- Feedback visual de tentativas restantes
- Botão para voltar

### 6. **src/components/forms/SignUpForm.tsx** (Modificado)
Formulário de cadastro com fluxo de 2 etapas.

1. Etapa 1: Formulário tradicional (nome, email, senha)
2. Etapa 2: Verificação de email com código OTP

## 🧪 Como Testar

### Teste Local

1. **Iniciar servidor:**
```bash
npm run dev
```

2. **Acessar página de cadastro:**
```
http://localhost:3000/auth/signup
```

3. **Preencher formulário de cadastro:**
   - Nome: João Silva
   - Email: teste@example.com
   - Senha: senha123456Abc
   - Confirmar: senha123456Abc

4. **Copiar código do console:**
   - Abrir console do servidor (terminal)
   - Procurar por: `📧 OTP para teste@example.com: XXXXXX`

5. **Inserir código:**
   - Clicar em cada campo e digitar o número
   - Ou colar todo o código (se copiar)

6. **Verificar:**
   - Clicar em "Verificar Código"
   - Redirecionamento automático para login

### Teste de Reenvio

1. Solicitar reenvio antes de 10 minutos
   - Erro: "Um código já foi enviado recentemente"

2. Após 10 minutos, solicitar novamente
   - Sucesso: Novo código gerado

3. Usar botão "Reenviar código"
   - Cooldown de 60 segundos
   - Novo código enviado

### Teste de Tentativas

1. Inserir código incorreto 5 vezes
   - Bloqueio automático
   - Mensagem: "Muitas tentativas. Solicite um novo código"

## 🚀 Próximas Etapas (Produção)

### 1. Integrar Serviço de Email

Remover simulação do console e usar um serviço real:

**Opção 1: Resend (Recomendado)**
```bash
npm install resend
```

**Opção 2: SendGrid**
```bash
npm install @sendgrid/mail
```

**Opção 3: AWS SES / Brevo / MailerSend**

### 2. Armazenar OTP em Banco de Dados

Modificar `lib/otp.ts` para usar Supabase:

```typescript
// Em vez de memória, salvar em tabela otp_codes
const { data, error } = await supabase
  .from('otp_codes')
  .insert({
    email,
    code: hashedCode,
    expires_at: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0
  })
```

### 3. Adicionar Campo email_verified_at

Modificar schema de usuários para rastrear verificação:

```sql
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP DEFAULT NULL;
```

### 4. Implementar Rate Limiting

Adicionar limite de requisições por IP/email:

```bash
npm install @upstash/ratelimit redis
```

### 5. Logs e Monitoramento

Integrar com Sentry ou similar para monitorar erros.

## 📱 Fluxo Visual

```
┌─────────────────────┐
│   Página de SignUp  │
│  (Formulário)       │
└──────────┬──────────┘
           │
      Cadastrar
           │
           ↓
┌─────────────────────┐
│   Email Enviado?    │
│   ✓ Usuário criado  │
│   ✓ OTP gerado      │
│   ✓ Enviado         │
└──────────┬──────────┘
           │
      Próximo Passo
           │
           ↓
┌─────────────────────┐
│  Inserir Código OTP │
│  [ 1 ][ 2 ][ 3 ]... │
│  [  Verificar   ]   │
└──────────┬──────────┘
           │
      Verificar
           │
      ┌────┴────┐
      ↓         ↓
   ✓ Válido   ✗ Inválido
      │         │
      ↓         ↓
    Login    Retry
```

## 🔐 Segurança

### Implementado ✓
- Códigos de 6 dígitos aleatórios
- Expiração em 10 minutos
- Limite de 5 tentativas
- Tokens únicos

### A Implementar
- Hash de códigos no banco de dados
- Rate limiting por IP
- Rate limiting por email
- Emails HTTPS
- CORS restrito
- Validação de origem

## 📊 Estrutura de Dados

### OTP Storage (Em Memória)
```typescript
{
  "usuario@example.com": {
    code: "123456",           // Código OTP
    expiresAt: 1234567890,    // Timestamp de expiração
    attempts: 2               // Tentativas usadas
  }
}
```

### Banco de Dados (Futuro)
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📝 Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Email (quando implementado)
RESEND_API_KEY=your_key
SENDGRID_API_KEY=your_key
```

## 🐛 Troubleshooting

**Q: Não estou vendo o código no console**
- Verificar se o servidor está rodando em desenvolvimento
- Ver se há logs no terminal do servidor
- Método alternativo: Abrir DevTools → Network → POST /api/auth/send-code → Response

**Q: Código expirou muito rápido**
- Padrão é 10 minutos
- Modificar em `lib/otp.ts` → `expirationMinutes`

**Q: Não consigo inserir o código**
- Apenas números são aceitos
- Deve ter 6 dígitos
- Foco automático entre campos

**Q: Redireciona antes de verificar**
- Verificar resposta de `verify-code`
- Garantir que não há redirecionamento prematuro em `SignUpForm.tsx`

## 📚 Referências

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
