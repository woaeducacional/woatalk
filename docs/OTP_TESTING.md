# 🧪 Guia de Testes - Validação de Email com OTP

## ⚡ Teste Rápido (2 minutos)

### 1️⃣ Iniciar o servidor
```bash
npm run dev
```

### 2️⃣ Acessar a página de cadastro
```
http://localhost:3000/auth/signup
```

### 3️⃣ Preencher o formulário
```
Nome:                   João Silva Teste
Email:                  teste@example.com
Senha:                  Senha123456
Confirmar Senha:        Senha123456
```

### 4️⃣ Clicar em "Criar Conta"
- Formulário será enviado
- Sistema criará o usuário
- Página muda automaticamente para verificação de email

### 5️⃣ Copiar o código do console
Olhe para o terminal onde o servidor está rodando e procure por:
```
📧 OTP para teste@example.com: 123456
```

### 6️⃣ Inserir o código
- Clique no primeiro campo (input com placeholder "0")
- Digite os 6 dígitos do código
- **OU** Paste (Ctrl+V) todo o código de uma vez
- O foco se move automaticamente entre os campos

### 7️⃣ Clicar em "Verificar Código"
✅ Sucesso! Redirecionado para login

---

## ✅ Validar Cada Funcionalidade

### Teste 1: Código Válido
```
1. Código correto → [Verificar] → ✅ Redireciona para /auth/signin?verified=true
```

### Teste 2: Código Inválido
```
1. Digitar: 000000 → [Verificar]
2. Erro: "Código inválido. 4 tentativa(s) restante(s)"
3. Campo limpa automaticamente
4. Foco retorna ao primeiro input
```

### Teste 3: Limite de Tentativas
```
1. Inserir código errado 5 vezes
2. Na 5ª tentativa: "Muitas tentativas. Solicite um novo código"
3. Código é deletado do servidor
4. Botão de reenviar fica disponível
```

### Teste 4: Código Expirado
```
1. Enviar código
2. Aguardar 10 minutos
3. Tentar verificar código antigo
4. Erro: "Código expirado. Solicite um novo código"
```

### Teste 5: Reenviar Código
```
1. Clicar em "Reenviar código"
2. Novo código aparece no console
3. Botão mostra: "Reenviar em 60s" (conta regressiva)
4. Após 60s, botão fica disponível novamente
```

### Teste 6: Voltando para Cadastro
```
1. Na tela de verificação, clicar em "Voltar"
2. Volta para formulário de cadastro
3. Campos estão vazios e prontos para novo cadastro
```

### Teste 7: Código Anti-Spam
```
1. Preencher formulário e clicar "Criar Conta"
2. Antes de 10 minutos, criar nova conta com mesmo email
3. Erro: "Um código já foi enviado recentemente. Aguarde alguns minutos."
```

### Teste 8: Email Não Encontrado
```
1. Na tela de verificação, clicar "Reenviar código"
2. Ao reenviar para email inexistente:
3. Erro: "Email não encontrado"
```

---

## 🔍 Verificar Respostas das APIs

### Endpoint: `/api/auth/send-code` (POST)

**Request:**
```json
{
  "email": "teste@example.com"
}
```

**Response (Sucesso):**
```json
{
  "message": "Código enviado com sucesso",
  "email": "teste@example.com",
  "debug": {
    "code": "123456"
  }
}
```

**Response (Email já registrado com código pendente):**
```json
{
  "error": "Um código já foi enviado recentemente. Aguarde alguns minutos."
}
```

### Endpoint: `/api/auth/verify-code` (POST)

**Request:**
```json
{
  "email": "teste@example.com",
  "code": "123456"
}
```

**Response (Sucesso):**
```json
{
  "message": "Email verificado com sucesso",
  "user": {
    "id": "uuid-aqui",
    "email": "teste@example.com",
    "name": "João Silva Teste"
  }
}
```

**Response (Código inválido):**
```json
{
  "error": "Código inválido. 4 tentativa(s) restante(s)"
}
```

---

## 🔧 Debug com DevTools

### 1. Abrir Network (DevTools)
- Pressionar `F12` no navegador
- Ir para aba "Network"
- Refrescar a página

### 2. Enviar Código
- Preencher e clicar "Criar Conta"
- Na aba Network, procurar por `send-code`
- Clique para ver detalhes
- Verificar Response (contém o código em desenvolvimento)

### 3. Verificar Código
- Na tela de verificação, inserir código
- Clicar "Verificar Código"
- Na aba Network, procurar por `verify-code`
- Verificar Status (200 = sucesso, 400 = erro)

---

## 🚨 Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|--------|
| "Por favor, insira o código completo" | Não digitou 6 dígitos | Complete os 6 campos |
| "Email inválido" | Email não existe | Criar conta primeiro com aquele email |
| "Código inválido" | Dígitos errados | Copiar código do console e reenviar |
| "Código expirado" | Passou 10 minutos | Clicar "Reenviar código" |
| "Muitas tentativas" | 5 erros consecutivos | Reenviar código |
| Página não muda de etapa | Erro no servidor | Ver console do Node.js |

---

## 📱 Teste em Mobile

1. Abrir em celular: `http://[seu-ip]:3000/auth/signup`
2. Preencher dados
3. Código estará no console do navegador (F12)
4. Inserir código nos 6 inputs
5. Verificar funciona normalmente

---

## 🔐 Validações Implementadas

✅ Email deve ser válido (formato)  
✅ Código deve ter 6 dígitos  
✅ Usuário deve existir  
✅ Código não pode estar expirado  
✅ Limite de 5 tentativas por código  
✅ Cooldown anti-spam (1 código ativo por email)  

---

## ✨ Próximas Etapas

Após testar com sucesso:

1. **Integrar email real** → Resend, SendGrid, AWS SES
2. **Salvar OTP em banco** → Supabase
3. **Adicionar campo** → `email_verified_at` na tabela users
4. **Rate limiting** → Por IP, por email
5. **Testes E2E** → Cypress ou Playwright

---

## 📞 Suporte

Ver documentação completa em: [EMAIL_VERIFICATION_GUIDE.md](./EMAIL_VERIFICATION_GUIDE.md)
