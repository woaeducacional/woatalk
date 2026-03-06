# 🔧 Comandos Úteis - WOA Talk Development

## 🚀 Inicialização

```bash
# Instalar todas as dependências
npm install

# Gerar AUTH_SECRET
npm run gen-secret

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar a aplicação
# Abrir: http://localhost:3000
```

---

## 📱 Páginas Importantes

### Públicas (Sem autenticação necessária)
```
http://localhost:3000/auth/signup      → Página de cadastro
http://localhost:3000/auth/signin      → Página de login
http://localhost:3000                   → Home (redirect para login se não autenticado)
```

### Protegidas (Requer autenticação)
```
http://localhost:3000/dashboard        → Dashboard principal
```

---

## 🔑 Configuração de Variáveis de Ambiente

### Criar .env.local
```bash
# Copiar template
cp .env.example .env.local

# Editar arquivo
# Windows: abre em editor
notepad .env.local

# macOS/Linux
nano .env.local
```

### Variáveis Necessárias
```env
# Supabase (pegue no dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=chave_secreta_aqui

# Auth.js (gere com: npm run gen-secret)
AUTH_SECRET=gere_uma_chave_aleatoria

# Ambiente
NEXTAUTH_URL=http://localhost:3000
```

---

## 🗄️ Banco de Dados

### Fazer migrations no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Crie nova query
5. Cole o conteúdo de `db/schema.sql`
6. Clique em **RUN**

### Verificar Tabelas Criadas
```bash
# Via Supabase Dashboard:
# Dashboard → Schema editor → Visualizar todas as tabelas
```

### Inserir Dados de Teste
```sql
-- No Supabase SQL Editor
INSERT INTO users (email, name, password_hash) VALUES
('test@example.com', 'Usuário Teste', 'hash_bcrypt_aqui');
```

---

## 🧪 Testes Manuais

### Teste 1: Cadastro Completo
```
1. Acesse: http://localhost:3000/auth/signup
2. Preencha:
   - Nome: João Silva
   - Email: joao@example.com
   - Senha: SenhaForte123
   - Confirmar Senha: SenhaForte123
3. Clique em "Criar Conta"
4. Resultado esperado: Redirecionado para login
```

### Teste 2: Validação de Email Duplicado
```
1. Tente cadastrar mesmo email novamente
2. Resultado esperado: "Email já está registrado"
```

### Teste 3: Validação de Senha Fraca
```
1. Tente cadastrar com senha: "123"
2. Resultado esperado: "Senha deve ter pelo menos 8 caracteres"
```

### Teste 4: Login Bem-Sucedido
```
1. Acesse: http://localhost:3000/auth/signin
2. Email: joao@example.com
3. Senha: SenhaForte123
4. Resultado esperado: Redirecionado para dashboard
```

### Teste 5: Login com Credenciais Erradas
```
1. Acesse: http://localhost:3000/auth/signin
2. Email: joao@example.com
3. Senha: SenhaErrada123
4. Resultado esperado: "Email ou senha incorretos"
```

### Teste 6: Acesso Protegido
```
1. Sem fazer login, acesse: http://localhost:3000/dashboard
2. Resultado esperado: Redirecionado para login
3. Faça login
4. Resultado esperado: Pode acessar dashboard
```

---

## 🛠️ Desenvolvimento

### Criar Novo Componente UI
```bash
# Criar arquivo em:
# src/components/ui/MeuComponente.tsx

# Exemplo:
touch src/components/ui/Alert.tsx
```

### Criar Novo Formulário
```bash
# Criar arquivo em:
# src/components/forms/MeuFormulario.tsx

# Exemplo:
touch src/components/forms/ResetPasswordForm.tsx
```

### Criar Nova Página
```bash
# Criar arquivo em:
# app/minhaRota/page.tsx

# Exemplo:
mkdir -p app/profile
touch app/profile/page.tsx
```

### Criar Nova API Route
```bash
# Criar arquivo em:
# app/api/min ha-rota/route.ts

# Exemplo:
mkdir -p app/api/users
touch app/api/users/profile/route.ts
```

---

## 📦 Build e Deployment

### Build para produção
```bash
npm run build
```

### Iniciar servidor de produção
```bash
npm start
```

### Deploy no Vercel
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel

# 4. Configurar variáveis em produção
# Vercel Dashboard → Settings → Environment Variables
```

### Variáveis para Produção
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_produção
AUTH_SECRET=chave_secreta_produção
NEXTAUTH_URL=https://seu-dominio.com
```

---

## 🐛 Debugging

### Ver Logs de Erro
```bash
# Terminal onde npm run dev está rodando
# Procure por mensagens de erro em vermelho

# Ou abra DevTools do navegador (F12)
# Vá em Console tab
```

### Verificar Conexão Supabase
```javascript
// No DevTools Console:
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Teste',
    email: 'teste@test.com',
    password: 'Teste123',
    confirmPassword: 'Teste123'
  })
});
console.log(await response.json());
```

### Verificar Sessão
```javascript
// No DevTools Console (após fazer login):
const response = await fetch('/api/auth/session');
console.log(await response.json());
```

---

## 🔍 Inspecionar BD

### Via Supabase Dashboard
```
Dashboard → Table Editor → users
→ Ver todos os usuários cadastrados
```

### Via Query SQL
```sql
-- No SQL Editor do Supabase
SELECT id, email, name, created_at FROM users;
SELECT * FROM users WHERE email = 'joao@example.com';
```

---

## 🔐 Segurança

### Verificar AUTH_SECRET
```bash
# Gerar novo AUTH_SECRET
npm run gen-secret

# Nunca committe em git:
# Adicionar em .gitignore
echo ".env.local" >> .gitignore
```

### Ativar Row Level Security (RLS)
```bash
# No Supabase Dashboard:
# 1. Vá em SQL Editor
# 2. Execute políticas RLS
# 3. Proteja acesso aos dados
```

---

## 📚 Referência Rápida

| Comando | O quê Faz |
|---------|-----------|
| `npm install` | Instala dependências |
| `npm run dev` | Inicia dev server |
| `npm run build` | Build para produção |
| `npm start` | Inicia serv prod |
| `npm run gen-secret` | Gera AUTH_SECRET |
| `npm run lint` | Verifica erros |

---

## 🌍 URLs Importantes

| Serviço | URL | O quê |
|---------|-----|-------|
| **Localhost** | `http://localhost:3000` | App local |
| **Supabase** | `https://app.supabase.com` | BD e auth |
| **Auth.js Docs** | `https://authjs.dev` | Documentação |
| **NextAuth Providers** | `https://authjs.dev/getting-started/providers` | Provedores OAuth |
| **Tailwind** | `https://tailwindcss.com` | CSS framework |

---

## 💡 Dicas Pro

```bash
# Hot reload automático
# Salvy arquivo → dev server atualiza automaticamente ✨

# Usar DevTools do VS Code
# F5 → Launch Chrome → Debug

# Limpar cache
# rm -rf .next node_modules
# npm install && npm run dev

# Checar porta em uso
# lsof -i :3000  (macOS/Linux)
# netstat -ano | findstr :3000 (Windows)

# Kill processo na porta
# kill -9 <PID>  (macOS/Linux)
# taskkill /PID <PID> /F  (Windows)
```

---

## 📝 Exemplo de Workflow Diário

```bash
# 1. Começar o dia
npm run dev
# Deixar rodando num terminal

# 2. Em outro terminal, fazer edições
code src/components/forms/SignUpForm.tsx

# 3. Ver mudanças em tempo real
# http://localhost:3000/auth/signup

# 4. Fazer commit
git add .
git commit -m "feat: adicionar validação de senha forte"
git push origin feat/cadastro

# 5. Ao terminar, fazer build
npm run build

# 6. Se tudo ok, fazer merge para main
git checkout main
git merge feat/cadastro
```

---

## 🆘 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| **"Cannot find module"** | `npm install` |
| **Porta 3000 em uso** | `lsof -i :3000` então `kill -9 <PID>` |
| **Supabase não conecta** | Verifique `.env.local` |
| **Sessão não persiste** | Verifique `AUTH_SECRET` |
| **Erro 404 em rotas** | Verifique path da página |
| **Tailwind não aplica** | Restart dev server |

---

**Última atualização**: Março 2026
**Próxima revisão**: Conforme adições ao projeto
