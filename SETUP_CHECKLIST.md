# 📋 Checklist de Configuração - Autenticação WOA Talk

## ✅ Concluído

- [x] Instalação de dependências (next-auth, zod, tailwind, etc)
- [x] Configuração de Tailwind CSS
- [x] Componentes UI (Button, Input, Card, Form)
- [x] Schema Zod para validação
- [x] Autenticação Auth.js com Credentials
- [x] Página de Sign Up (/auth/signup)
- [x] Página de Sign In (/auth/signin)
- [x] API route de registro (/api/auth/signup)
- [x] API route Auth.js handler (/api/auth/[...nextauth])
- [x] Middleware de proteção de rotas
- [x] Dashboard básico (/dashboard)
- [x] Schema SQL para banco de dados

---

## 🔄 Próximas Etapas (TODO)

### 1️⃣ Configuração Supabase
- [ ] Criar projeto Supabase
- [ ] Executar schema.sql no SQL Editor
- [ ] Ativar Row Level Security (RLS)
- [ ] Criar políticas de segurança
- [ ] Copiar credenciais para .env.local

### 2️⃣ Testes de Autenticação
- [ ] Testar cadastro com dados válidos
- [ ] Testar validação de email duplicado
- [ ] Testar validação de senha fraca
- [ ] Testar login com credenciais corretas
- [ ] Testar login com credenciais incorretas
- [ ] Testar redirecionamento automático de rotas protegidas
- [ ] Testar session persistence após refresh

### 3️⃣ Funcionalidades de Senha
- [ ] Implementar "Esqueci minha senha"
- [ ] Token de reset com expiração
- [ ] Envio de email com nodemailer/resend
- [ ] Validação de token no backend

### 4️⃣ Validação e Segurança
- [ ] Implementar rate limiting no signup/login
- [ ] Email verification antes de ativar conta
- [ ] CAPTCHA no signup (opcional)
- [ ] WAF rules no Supabase
- [ ] Audit logs de autenticação

### 5️⃣ Integração OAuth (Opcional)
- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] Sync de perfil do OAuth ao Supabase

### 6️⃣ Dashboard & Onboarding
- [ ] Criar fluxo de onboarding (seleção de nível)
- [ ] Completar design do dashboard
- [ ] Integrar dados reais de XP/Coins
- [ ] Implementar mapa visual do oceano
- [ ] Botão "Começar Jornada"

### 7️⃣ Sistema de Lições
- [ ] Criar estrutura de lições em BD
- [ ] API de lições (GET /api/lessons)
- [ ] Componente LessonPlayer
- [ ] Componente ExerciseEngine
- [ ] Sistema de XP/Coins ao completar

### 8️⃣ Gamificação
- [ ] Sistema de Streaks (dias consecutivos)
- [ ] Badges (Coral, Explorer, Ocean Master)
- [ ] WOA Coins (moeda virtual)
- [ ] Daily error limit (5 erros/dia)
- [ ] Progressão de XP

### 9️⃣ Admin Panel (Futuro)
- [ ] Dashboard admin
- [ ] Gerenciamento de usuários
- [ ] Estatísticas de uso
- [ ] Controle de conteúdo

### 🔟 Deploy & Produção
- [ ] Deploy no Vercel
- [ ] Variáveis de ambiente em produção
- [ ] SSL/HTTPS automático
- [ ] Custom domain
- [ ] Monitoring e logging

---

## 🎯 Estimativa de Tempo

| Fase | Tarefas | Tempo |
|------|---------|-------|
| **Preparação** | Configurar Supabase + testes | 1-2h |
| **Sign In/Up** | Implementar + testar | 2-3h |
| **Segurança** | Rate limiting + RLS | 2-3h |
| **Onboarding** | Dashboard + fluxo inicial | 3-4h |
| **Lições** | Sistema base de lições | 4-6h |
| **Gamificação** | XP, Coins, Badges, Streaks | 4-6h |
| **Polish** | Testing, bugs, UX refinement | 3-4h |

**Total estimado**: 19-28 horas

---

## 🔗 Recursos Úteis

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Auth.js Documentation](https://authjs.dev)
- [PostgreSQL & Supabase SQL](https://www.postgresql.org/docs)
- [Tailwind CSS Components](https://tailwindui.com)
- [Zod Schema Validation](https://zod.dev)

---

## 💡 Dicas Importantes

1. **Teste localmente primeiro** antes de hacer deploy
2. **Guarde seu AUTH_SECRET** em local seguro
3. **Não committe .env.local** (adicionar em .gitignore)
4. **Ative RLS** no Supabase para segurança
5. **Use variáveis de ambiente** para credenciais
6. **Implemente rate limiting** antes de ir para produção
7. **Monitore logs** de autenticação para security issues

---

**Última atualização**: Março 2026
**Status da implementação**: 40% (Autenticação base implementada)
