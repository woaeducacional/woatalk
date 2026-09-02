import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("que o ambiente de testes está configurado", () => {
  cy.wrap(true).should("eq", true);
});

When("executo um cenário automatizado", () => {
  cy.log("Executando cenário BDD");
});

Then("o cenário deve ser concluído com sucesso", () => {
  expect(true).to.equal(true);
});
