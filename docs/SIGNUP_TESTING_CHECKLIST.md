# ✅ Checklist de Testes - Sistema de Cadastro

## 🧪 Teste Manual - Cadastro Completo

Estes testes devem ser executados em um navegador real durante o desenvolvimento.

---

## 1️⃣ Testes de Validação do Formulário

### 1.1 - Nome Vazio
```
[ ] Deixar campo "Nome" vazio
[ ] Verificar se aparece erro: "Nome é obrigatório"
[ ] Botão "Próximo" deve estar desabilitado
```

### 1.2 - Nome Muito Curto
```
[ ] Digitar nome: "J"  
[ ] Verificar se aparece erro: "Nome deve ter pelo menos 2 caracteres"
[ ] Digitar nome: "Jo"
[ ] O erro deve desaparecer
```

### 1.3 - Email Vazio
```
[ ] Deixar campo "Email" vazio
[ ] Verificar se aparece erro: "Email é obrigatório"
```

### 1.4 - Email Inválido
```
[ ] Digitar: "emailinvalido"
[ ] Verificar se aparece erro: "Email inválido"
[ ] Digitar: "email@"
[ ] Verificar se aparece erro: "Email inválido"
[ ] Digitar: "email@example.com"
[ ] O erro deve desaparecer
```

### 1.5 - Senha Vazia
```
[ ] Deixar campo "Senha" vazio
[ ] Verificar se aparece erro: "Senha é obrigatória"
```

### 1.6 - Senha Muito Curta
```
[ ] Digitar senha: "Abc1"
[ ] Verificar se aparece erro: "Senha deve ter pelo menos 8 caracteres"
[ ] Digitar senha: "Abc12345"
[ ] O erro deve desaparecer
```

### 1.7 - Senha Sem Maiúscula
```
[ ] Digitar senha: "abc123456"
[ ] Verificar se aparece erro: "Senha deve conter pelo menos uma letra maiúscula"
[ ] Digitar senha: "Abc123456"
[ ] O erro deve desaparecer
```

### 1.8 - Senha Sem Número
```
[ ] Digitar senha: "AbcDefghi"
[ ] Verificar se aparece erro: "Senha deve conter pelo menos um número"
[ ] Digitar senha: "AbcDefgh1"
[ ] O erro deve desaparecer
```

### 1.9 - Confirmação de Senha Vazia
```
[ ] Preencher todos os campos
[ ] Deixar "Confirmar Senha" vazio
[ ] Verificar se aparece erro: "Confirmação de senha é obrigatória"
```

### 1.10 - Senhas Não Correspondem
```
[ ] Digitar Senha: "Senha12345"
[ ] Digitar Confirmar Senha: "Senha12346"
[ ] Verificar se aparece erro: "As senhas não correspondem"
[ ] Corrigir Confirmar Senha para: "Senha12345"
[ ] O erro deve desaparecer
```

---

## 2️⃣ Testes de Submissão do Formulário

### 2.1 - Cadastro com Sucesso (Email Novo)
```
[ ] Preencher com dados válidos:
    - Nome: "Maria Silva"
    - Email: "maria.silva.2026@gmail.com"  (email que você tem acesso)
    - Senha: "MariaSenha123"
    - Confirmar: "MariaSenha123"
[ ] Clicar "Próximo"
[ ] Aparece mensagem de sucesso?
[ ] Redirecionado para tela de verificação de email?
[ ] Campo de email é mostrado na tela: "maria.silva.2026@gmail.com"?
```

### 2.2 - Cadastro com Email Duplicado
```
[ ] Usar um email que já foi cadastrado anteriormente
[ ] Clicar "Próximo"
[ ] Verificar se aparece erro: "Este email já está cadastrado"
[ ] Botão "Voltar" deve retornar ao formulário vazio?
```

### 2.3 - Erro de Servidor (Simulado)
```
[ ] Se o servidor está desligado:
    - Preencher formulário
    - Clicar "Próximo"
    - Verificar se aparece erro: "Erro ao conectar ao servidor"
```

---

## 3️⃣ Testes da Verificação de Email

### 3.1 - Recebimento do Email
```
[ ] Após submeter cadastro, verificar caixa de entrada
[ ] Email deve vir de: "no-reply@resend.dev"
[ ] Assunto deve conter: "WOA Talk" ou "código"
[ ] Email deve conter o código de 6 dígitos
[ ] Email deve avisar: "Este código expira em 10 minutos"
```

### 3.2 - Digitação do Código (Sucesso)
```
[ ] Copiar o código do email (ex: 483019)
[ ] Voltar para o app na tela de verificação
[ ] Digitar o código:
    - Digite "4" no primeiro campo → focus vai para o segundo
    - Digite "8" → focus vai para o terceiro
    - Digite "3" → focus vai para o quarto
    - Digite "0" → focus vai para o quinto
    - Digite "1" → focus vai para o sexto
    - Digite "9" → código é verificado automaticamente
[ ] Deve aparecer: "✅ Email verificado com sucesso"
[ ] Redirecionado automaticamente para /dashboard?
[ ] Nome do usuário aparece no dashboard?
```

### 3.3 - Digitação do Código (Fracasso)
```
[ ] Na tela de verificação, digitar código errado: 999999
[ ] Ao digitar o 6º número, deve aparecer: "❌ Código inválido"
[ ] Os 6 campos devem ficar em vermelho
[ ] Botão "Reenviar Código" deve estar disponível?
[ ] Campos devem estar vazios novamente?
```

### 3.4 - Colar Código Inteiro
```
[ ] Copiar o código inteiro (ex: 483019)
[ ] Na tela de verificação, clicar no primeiro campo
[ ] Digitar Ctrl+V (colar)
[ ] Todos os 6 campos devem ser preenchidos?
[ ] Código deve ser verificado automaticamente?
```

### 3.5 - Usar Backspace
```
[ ] Digitar alguns números: "4", "8", "3"
[ ] Clicar no 3º campo
[ ] Pressionar Backspace
[ ] O número "3" desaparece?
[ ] Focus volta para o 2º campo?
```

### 3.6 - Botão Reenviar Código
```
[ ] Digitar código errado
[ ] Clicar botão "Reenviar Código"
[ ] Botão deve ficar desabilitado?
[ ] Contador deve aparecer: "Reenviar em 60s"?
[ ] Após 60 segundos, counter decresce até 0?
[ ] Novo email deve ser recebido com código diferente?
[ ] Novo código deve funcionar na verificação?
```

### 3.7 - Botão Voltar
```
[ ] Na tela de verificação, clicar "Voltar"
[ ] Redirecionado para o formulário de cadastro?
[ ] Formulário deve estar vazio?
```

### 3.8 - Tentativas Excedidas
```
[ ] Digitar código errado 5 vezes
[ ] Na 5ª tentativa, deve aparecer: "Máximo de tentativas excedido"
[ ] Botão "Reenviar Código" deve estar ativo?
[ ] Clicar para reenviar código
[ ] Novo código deve funcionar?
```

### 3.9 - Código Expirado
```
[ ] Copiar o código do email
[ ] Aguardar 10 minutos
[ ] Digitar o código na verificação
[ ] Deve aparecer: "Código expirado ou inválido"
[ ] Clicar para reenviar código
[ ] Novo código deve funcionar?
```

---

## 4️⃣ Testes de Integração Completa

### 4.1 - Fluxo Completo: Cadastro → Login
```
[ ] Criar conta com email novo: "teste.novo.2026@gmail.com"
[ ] Verificar email recebido
[ ] Digitar código de verificação com sucesso
[ ] Redirecionado para dashboard
[ ] Dashboard mostra nome do usuário?
[ ] Clicar "Sair"
[ ] Redirecionado para /auth/signin?
[ ] Efetuar login com o mesmo email e senha
[ ] Redirecionado para dashboard novamente?
[ ] Informações da conta estão corretas?
```

### 4.2 - Não é Possível Registrar Duas Vezes
```
[ ] Cadastrar com email: "joao.silva.2026@gmail.com"
[ ] Completar verificação
[ ] Voltar para /auth/signup
[ ] Tentar cadastrar com o mesmo email
[ ] Sistema deve avisar: "Este email já está cadastrado"
```

### 4.3 - Dados Persistem no Banco
```
[ ] Cadastrar novo usuário: nome "Ana Costa"
[ ] Completar verificação
[ ] Fazer logout
[ ] Fazer login novamente
[ ] Dashboard deve mostrar: "Bem-vindo, Ana Costa"?
[ ] Avatar, XP, moedas devem estar ali?
```

---

## 5️⃣ Testes de Performance

### 5.1 - Tempo de Resposta
```
[ ] Ao clicar "Próximo" no formulário:
    - Deve processar em menos de 2 segundos? (com internet boa)
    - Loading spinner deve aparecer durante o processamento?
```

### 5.2 - Envio de Email
```
[ ] Após submeter cadastro:
    - Email deve chegar em menos de 5 segundos? (Resend é rápido)
    - Às vezes pode levar até 30 segundos, mas é raro
```

### 5.3 - Múltiplas Tentativas
```
[ ] Fazer 3-4 cadastros seguidos (com emails diferentes)
[ ] Sistema deve comportar a mesma velocidade?
[ ] Nenhum bug de concorrência?
```

---

## 6️⃣ Testes de Compatibilidade

### 6.1 - Desktop Chrome
```
[ ] Abrir em: Google Chrome (última versão)
[ ] Seguir teste 1.1 até 4.3
[ ] Tudo funciona?
```

### 6.2 - Desktop Firefox
```
[ ] Abrir em: Firefox (última versão)
[ ] Seguir teste 1.1 até 4.3
[ ] Tudo funciona?
```

### 6.3 - Desktop Safari
```
[ ] Abrir em: Safari (se tiver Mac)
[ ] Seguir teste 1.1 até 4.3
[ ] Tudo funciona?
```

### 6.4 - Desktop Edge
```
[ ] Abrir em: Microsoft Edge
[ ] Seguir teste 1.1 até 4.3
[ ] Tudo funciona?
```

### 6.5 - Mobile (iPhone)
```
[ ] Abrir em: Safari Mobile (iPhone)
[ ] Layout é responsivo (não quebra)?
[ ] Input de email abre teclado correto?
[ ] Digitar código funciona no mobile?
[ ] Colar código funciona no mobile?
```

### 6.6 - Mobile (Android)
```
[ ] Abrir em: Chrome Mobile (Android)
[ ] Layout é responsivo (não quebra)?
[ ] Input de email abre teclado correto?
[ ] Digitar código funciona no mobile?
[ ] Colar código funciona no mobile?
```

---

## 7️⃣ Testes de Segurança

### 7.1 - Senha Está Criptografada
```
[ ] Acessar banco de dados (se tiver acesso)
[ ] Ver a coluna "password_hash" de um usuário
[ ] NÃO deve estar visível a senha em texto claro?
[ ] Deve ser algo como: "$2a$10$xyz..."?
```

### 7.2 - XSS (Injeção de Código)
```
[ ] No campo Nome, digitar: "<script>alert('XSS')</script>"
[ ] Clicar "Próximo"
[ ] Não deve executar o script (não deve haver alert)?
[ ] No dashboard, não deve haver "<script>" visível?
```

### 7.3 - SQL Injection (se aplicável)
```
[ ] No campo Email, digitar: "'; DROP TABLE users; --"
[ ] Clicar "Próximo"
[ ] Erro apropriado deve aparecer?
[ ] Tabela de usuários NÃO deve ser deletada?
```

### 7.4 - CSRF Protection
```
[ ] Verificar se endpoints POST têm proteção CSRF
[ ] NextAuth deve cuidar disso automaticamente
[ ] Tentar fazer request sem token deve falhar?
```

---

## 8️⃣ Testes de Acessibilidade

### 8.1 - Navegação por Teclado
```
[ ] Não usar mouse
[ ] Usar TAB para navegar entre campos
[ ] Usar ENTER para submeter
[ ] Tudo funciona?
```

### 8.2 - Leitura por Screen Reader
```
[ ] Usar screen reader (NVDA, JAWS, VoiceOver)
[ ] Labels de campos são lidos corretamente?
[ ] Mensagens de erro são anunciadas?
[ ] [ ] As instruções são claras?
```

### 8.3 - Contraste de Cores
```
[ ] Texto e fundo têm contraste suficiente?
[ ] Mensagens de erro são legíveis?
[ ] Campos habilitados/desabilitados são claros?
```

---

## 9️⃣ Testes de Casos Extremos

### 9.1 - Email Muito Longo
```
[ ] Digitar email com 255 caracteres
[ ] Submeter
[ ] Deve ser aceito ou rejeitar com mensagem clara?
```

### 9.2 - Nome com Caracteres Especiais
```
[ ] Digitar nome: "José da Silva"
[ ] Digitar nome: "María González"
[ ] Digitar nome: "李明"  (caracteres chineses)
[ ] Digitar nome: "😊 João"  (emoji)
[ ] Todos devem funcionar ou ser rejeitados com clareza?
```

### 9.3 - Submissão Dupla
```
[ ] Preencher formulário
[ ] Clicar "Próximo" duas vezes rapidamente
[ ] Deve criar apenas UMA conta?
[ ] Não deve criar duplicatas?
```

### 9.4 - Fechar Navegador Durante Cadastro
```
[ ] Preencher formulário
[ ] Clicar "Próximo"
[ ] Fechar a aba antes do email ser verificado
[ ] A conta foi criada no banco?
[ ] Pode entrar na página de verificação novamente?
```

---

## 🔟 Testes de Banco de Dados

### 10.1 - Usuário foi criado?
```
[ ] No banco de dados, verificar tabela "users"
[ ] Deve existir novo registro com:
    - ✅ id (UUID único)
    - ✅ name (nome do usuário)
    - ✅ email (email verificado)
    - ✅ password_hash (senha criptografada)
    - ✅ email_verified_at (data/hora que verificou)
    - ✅ created_at (quando foi criado)
```

### 10.2 - Senhas Diferentes
```
[ ] Criar 2 usuários com MESMA senha
[ ] Checar password_hash de ambos
[ ] Hashes devem ser DIFERENTES? (bcrypt adiciona salt)
```

### 10.3 - Email Foi Normalizado?
```
[ ] Cadastrar com: "Usuario@Gmail.COM"
[ ] No banco, verificar se está: "usuario@gmail.com" (minúsculas)?
```

---

## 1️⃣1️⃣ Teste de Recuperação de Falhas

### 11.1 - Servidor Fica Offline Durante OTP
```
[ ] Enviar formulário (cria conta e envia OTP)
[ ] Servidor fica offline
[ ] Esperar alguns segundos
[ ] Servidor volta online
[ ] Usuário consegue fazer login com a conta?
```

### 11.2 - Falha ao Enviar Email
```
[ ] Simular erro na API Resend:
    - Remover RESEND_API_KEY do .env
[ ] Submeter cadastro
[ ] Sistema deve mostrar erro: "Erro ao enviar email"?
[ ] Conta não deve ser criada?
```

---

## 📊 Sumário de Testes

| Categoria | Quantidade de Testes | Status |
|-----------|-------------------|--------|
| Validação do Formulário | 10 | ⬜ |
| Submissão | 3 | ⬜ |
| Verificação de Email | 9 | ⬜ |
| Integração Completa | 3 | ⬜ |
| Performance | 3 | ⬜ |
| Compatibilidade | 6 | ⬜ |
| Segurança | 4 | ⬜ |
| Acessibilidade | 3 | ⬜ |
| Casos Extremos | 4 | ⬜ |
| Banco de Dados | 3 | ⬜ |
| Recuperação de Falhas | 2 | ⬜ |
| **TOTAL** | **50 testes** | ⬜ |

---

## 🚀 Como Executar os Testes

### Preparação
```
1. npm run dev   (iniciar servidor)
2. Abrir http://localhost:3000/auth/signup
3. Abrir email (Gmail, Outlook, etc) em outra aba
```

### Execução
```
1. Seguir testes 1-11 nesta ordem
2. Marcar cada item com ✅ quando passar
3. Se algum teste falhar, anotar:
   - Qual teste falhou?
   - O que deveria ter acontecido?
   - O que realmente aconteceu?
   - Em qual navegador/device?
```

### Relatório
```
1. Contar quantos ✅ conseguiu
2. Contar quantos ❌ não passaram
3. Percentual de sucesso = (✅ / 50) * 100
```

---

## 📝 Notas Importantes

- **Emails reais:** Use emails reais que você tem acesso para receber os códigos
- **Diferentes emails:** Use emails diferentes para cada teste (ou pode causar conflito de "email duplicado")
- **Limpar entre testes:** Algumas vezes é bom deletar usuários de teste entre rodadas
- **Testar em produção:** Antes de lançar, repetir testes em https://woatalk.com
- **Automação futura:** Esses testes podem ser automatizados com Cypress/Playwright

