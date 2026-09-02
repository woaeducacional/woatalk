import {
  Given,
  When,
  Then,
} from "@badeball/cypress-cucumber-preprocessor";

Given("que acesso a página de login", () => {
  cy.visit("/auth/signin");
});

When("tento realizar login sem preencher os campos", () => {
  cy.contains("button", "CONTINUAR MINHA JORNADA").click();
});

Then("devo visualizar as mensagens de validação", () => {
  cy.contains("Email inválido").should("be.visible");
  cy.contains("Senha é obrigatória").should("be.visible");
});
