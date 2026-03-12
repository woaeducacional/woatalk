# 📧 Setup Resend - Envio de Emails

## ⚡ Primeiros Passos (5 minutos)

### 1️⃣ Criar Conta no Resend

Acesse: **https://resend.com**

- Clique em "Sign Up"
- Use Google, GitHub ou email
- Confirme o email

### 2️⃣ Obter Chave de API

1. Faça login no Resend
2. Vá para: **Dashboard → API Keys**
3. Clique em "Create API Key"
4. Copie a chave (começa com `re_`)

### 3️⃣ Configurar no Projeto

Abra `.env.local` e adicione:

```env
RESEND_API_KEY=re_sua_chave_aqui
```

**Exemplo:**
```env
RESEND_API_KEY=re_5C72cYmN8dF4gX2pQ9kL3m0RsWith7nAbC
```

### 4️⃣ Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
# Reinicie
npm run dev
```

### 5️⃣ Testar

1. Acesse: `http://localhost:3000/auth/signup`
2. Preencha o formulário
3. Clique "Criar Conta"
4. **Você receberá um email real! 📧**

---

## ✅ Verificação

Abra o email recebido e você verá:

```
🌊 WOA Talk
Código de Verificação
Use este código para verificar sua conta:

123456

Este código expira em 10 minutos
```

---

## 🔐 Segurança

⚠️ **Nunca faça commit da `.env.local`** com a chave real

Ela já está em `.gitignore` (seguro!)

---

## 💬 Dúvidas

**P: Qual é o limite de emails grátis?**  
R: 100 emails por dia (plano grátis)

**P: Posso usar meu próprio domínio?**  
R: Sim, em planos pagos. Para teste use `noreply@resend.dev`

**P: O código aparece no email?**  
R: Sim! Deixei o código visível e destacado no email

**P: Preciso verificar o domínio?**  
R: Não no plano grátis com `noreply@resend.dev`

---

## 📋 Checklist

- [ ] Conta Resend criada
- [ ] API Key copiada
- [ ] `.env.local` atualizado
- [ ] Servidor reiniciado
- [ ] Email recebido no teste

---

## 🚀 Status

✅ Sistema de email pronto!  
✅ OTP enviado por email real  
✅ Tudo funcionando  

Próximo passo: Testar o fluxo completo de signup → verificação → login
