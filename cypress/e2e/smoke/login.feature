# language: pt

Funcionalidade: Autenticação

  Cenário: Validar campos obrigatórios do login

    Dado que acesso a página de login
    Quando tento realizar login sem preencher os campos
    Então devo visualizar as mensagens de validação
