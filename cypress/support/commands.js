// Place custom Cypress commands here.

Cypress.Commands.add('login', (username, password) => {
  cy.get('#user-name').clear();
  if (username) {
    cy.get('#user-name').type(username);
  }

  cy.get('#password').clear();
  if (password) {
    cy.get('#password').type(password);
  }

  cy.get('#login-button').click();
});
