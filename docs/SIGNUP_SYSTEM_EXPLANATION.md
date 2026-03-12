# 📚 Como Funciona o Sistema de Cadastro - Explicação Narrativa

## 🎯 Visão Geral do Processo

O WOA Talk possui um sistema de cadastro em **duas etapas** para garantir que o usuário tenha acesso a um email válido. É como se fosse um procedimento de verificação de identidade: primeiro você preenche seus dados, depois você comprova que tem acesso ao email que forneceu.

---

## 📋 Etapa 1: Preenchimento do Formulário de Cadastro

Quando um usuário novo acessa a página de cadastro (`/auth/signup`), ele vê um formulário com os seguintes campos:

- **Nome Completo** - Para personalizações futuras no app
- **Email** - Onde receberá o código de verificação
- **Senha** - A senha que usará para fazer login depois
- **Confirmar Senha** - Para garantir que o usuário digitou a senha corretamente

### O que acontece enquanto o usuário digita?

O formulário valida **em tempo real** conforme o usuário digita:

- **Nome** precisa ter pelo menos 2 caracteres (evita nomes muito curtos)
- **Email** precisa ser um formato válido de email (ex: usuario@exemplo.com)
- **Senha** precisa ter pelo menos 8 caracteres, pelo menos 1 letra MAIÚSCULA e 1 número (ex: Senha1234)
- **Confirmação de Senha** precisa ser exatamente igual à senha anterior

Os campos que têm problemas ficam com borda vermelha e mostram uma mensagem de erro. À medida que o usuário corrige, as mensagens desaparecem e o botão "Próximo" fica habilitado.

### O que acontece quando o usuário clica "Próximo"?

1. O sistema valida **tudo novamente** para ter certeza
2. A senha é **criptografada** usando uma técnica chamada bcrypt (torna impossível alguém ver a senha real)
3. O usuário é registrado no banco de dados com status **não verificado**
4. Um **código de 6 dígitos** é gerado aleatoriamente (ex: 123456)
5. Esse código é **enviado para o email do usuário** via Resend

Se acontecer algum erro (ex: o email já foi cadastrado por outra pessoa), o usuário vê uma mensagem de erro em português explicando o problema.

---

## 🔐 Etapa 2: Verificação do Email

Depois de preencher o formulário, o usuário é levado para a segunda tela onde precisa **inserir o código que recebeu por email**.

### Como funciona a tela de verificação?

A tela mostra 6 campos pequenos, cada um para um dígito. O usuário pode:

- **Digitar normalmente** - O cursor passa automaticamente para o próximo campo
- **Colar o código inteiro** - Se o usuário colar "123456", todos os 6 dígitos aparecem
- **Usar Backspace** - Se errar, pode apagar números e voltar ao campo anterior
- **Renviar o código** - Um botão aparece que permite solicitar um novo código (mas só depois de 60 segundos)

### O que acontece quando o usuário digita o código?

A cada dígito digitado, o sistema **tenta verificar automaticamente** (assim que 6 dígitos forem inseridos). Se o código for correto:

1. O sistema marca o email como **verificado** no banco de dados
2. O usuário é **automaticamente logado**
3. Ele é **redirecionado para o dashboard** (a página principal do app)

Se o código estiver **errado**:

- Aparece uma mensagem de erro em vermelho: "Código inválido"
- Os 6 campos ficam em vermelho
- O usuário pode tentar novamente

### Regras de segurança do código:

- **Cada código é único** - Diferentes para cada tentativa
- **Válido por 10 minutos** - Depois expira automaticamente
- **Máximo 5 tentativas** - Se o usuário errar 5 vezes, o código é descartado
- **Um código por vez** - Se o usuário solicita um novo código, o código anterior deixa de funcionar

---

## 📧 Como o Email é Enviado?

Quando um código é gerado, o sistema envia um **email HTML bonito** para o usuário. O email contém:

- O logo do WOA Talk
- Uma mensagem dando boas-vindas
- **O código de 6 dígitos em destaque** (bem grande)
- Uma mensagem informando que o código expira em 10 minutos
- Um aviso de segurança pedindo para não compartilhar o código
- Um link para fazer login (para caso o usuário tenha problemas)

O email é enviado via **Resend**, um serviço de email profissional. No plano gratuito, é permitido enviar até 100 emails por dia.

---

## 🗄️ O que Acontece no Banco de Dados?

Quando um cadastro é concluído com sucesso, um novo usuário é criado na tabela `users` com as seguintes informações:

- **ID único** - Um identificador que não pode ser duplicado
- **Nome** - O nome que o usuário forneceu
- **Email** - O email verificado
- **Senha criptografada** - Não é possível ver ou recuperar a senha original
- **Status de verificação** - Marcado como verificado
- **Data de criação** - Marca quando a conta foi criada
- **Moedas/XP** - Zerados inicialmente (o usuário ganha esses durante o aprendizado)

---

## 🔄 Fluxo Completo (Resumido)

```
Usuário novo → Acessa /auth/signup
             ↓
             Preenche dados (nome, email, senha)
             ↓
             Clica "Próximo"
             ↓
             Sistema valida e envia código por email
             ↓
             Usuário acessa email e vê o código
             ↓
             Volta para o app e digita o código
             ↓
             Sistema verifica se está correto
             ↓
             Email marcado como verificado ✅
             ↓
             Usuário é logado automaticamente
             ↓
             Redirecionado para /dashboard
```

---

## ⚠️ Situações de Erro Comuns

### "Este email já está cadastrado"
Significa que alguém já criou uma conta com esse email. O usuário pode:
- Usar outro email
- Ir para a página de login e tentar entrar com esse email (talvez já tenha uma conta)
- Clicar em "Esqueceu a senha?" para recuperar acesso

### "Código inválido"
Significa que o código digitado está errado. Pode ter acontecido:
- O usuário digitou os números errados
- O código expirou (mais de 10 minutos)
- O usuário já tentou 5 vezes (código foi descartado)

Nesses casos, o botão "Reenviar Código" permite solicitar um novo código.

### "Erro ao conectar ao servidor"
Um erro técnico aconteceu. O usuário pode:
- Atualizar a página
- Tentar novamente em alguns segundos
- Se persistir, há um problema no servidor

---

## 🛡️ Segurança do Sistema

### O que está protegido?

1. **Senhas são criptografadas** - Mesmo os administradores não conseguem ver a senha original
2. **Email é verificado** - Garante que o usuário tem acesso àquele email
3. **Código é temporário** - Expira em 10 minutos, impossível usar para sempre
4. **Tentativas limitadas** - Evita que alguém tente adivinhar o código infinitamente
5. **Comunicação segura** - O email é enviado via HTTPS (criptografado)

### O que NÃO está protegido (ainda)?

- Não há limite de quantos cadastros podem ser feitos do mesmo IP (DDoS)
- Não há verificação de senhas fracas (no futuro queremos)
- Não há autenticação de dois fatores (no futuro queremos)
- Não há captcha para prevenir bots

---

## 🎬 Exemplo Prático: João Fazendo Cadastro

**11:00 - João acessa https://woatalk.com/auth/signup**
- Vê o formulário vazio

**11:02 - João preenche os dados:**
- Nome: João Silva ✅
- Email: joao@gmail.com ✅
- Senha: JoaoSenha123! ✅
- Confirmar: JoaoSenha123! ✅
- Clica "Próximo"

**11:03 - Sistema processa:**
- Valida tudo ✅
- Criptografa a senha ✅
- Cria usuário no banco ✅
- Gera código: 482957
- Envia email para joao@gmail.com ✅

**11:04 - João recebe o email**
- Vê a mensagem com o código 482957
- Volta para o app

**11:05 - João digita o código**
- Campo 1: 4
- Campo 2: 8
- Campo 3: 2
- Campo 4: 9
- Campo 5: 5
- Campo 6: 7 (ao digitar este, sistema verifica automaticamente)
- ✅ Código correto!

**11:06 - Sistema marca email como verificado**
- Cria sessão segura para João
- Redireciona para /dashboard

**11:07 - João está logado e pronto para aprender!**

---

## 📊 Dados Técnicos

### O que o Cliente (Navegador) Faz?
- Renderiza o formulário
- Valida em tempo real conforme o usuário digita
- Mostra/esconde mensagens de erro
- Ativa/desativa o botão de envio
- Envia dados para o servidor quando clicado

### O que o Servidor Faz?
- Recebe os dados
- Valida tudo novamente (nunca confia só no cliente)
- Criptografa a senha
- Salva no banco de dados
- Gera o código OTP
- Envia o email
- Retorna sucesso ou erro

### O que o Banco de Dados Faz?
- Armazena os dados do usuário
- Evita duplicatas de email
- Mantém histórico de cadastros

---

## 🚀 Próximas Melhorias Planejadas

- [ ] Permitir login com Google (OAuth)
- [ ] Permitir login com GitHub (OAuth)
- [ ] Verificação de senha forte em tempo real
- [ ] Captcha para prevenir bots
- [ ] Rate limiting (máximo de tentativas por IP)
- [ ] Recuperação de senha por email
- [ ] Autenticação de dois fatores (2FA)
- [ ] Verificação de email descartável (blocar temp-mail, etc)

---

## 📚 Conceitos-Chave Explicados

**Criptografia (bcrypt):** Transforma a senha em uma sequência aleatória impossível de reverter. Mesmo que alguém roubar o banco de dados, não consegue descobrir a senha original.

**OTP (One-Time Password):** Um código que funciona apenas uma vez e expira. Usado aqui para verificar o email.

**Hash:** Um fingerprint único de um dado. Duas senhas diferentes têm hashes diferentes.

**Sessão:** Uma "conexão autenticada" entre o usuário e o servidor, que permite o navegador "lembrar" que aquele usuário está logado.

**JWT (Token):** Um arquivo criptografado que armazena informações sobre quem está logado. Enviado pelo servidor e armazenado no navegador.

**HTTP-only Cookie:** Um lugar seguro no navegador para armazenar o JWT, que o JavaScript não consegue acessar (proteção contra roubo).

