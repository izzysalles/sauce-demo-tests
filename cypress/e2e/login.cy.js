import {
  VALID_USERNAME,
  VALID_PASSWORD,
  ERROR_INVALID_CREDENTIALS,
  ERROR_PASSWORD_REQUIRED,
  ERROR_USERNAME_REQUIRED
} from '../support/loginConstants';

describe('Sauce Demo Login', () => {
  const assertLoginSuccess = () => {
    cy.url().should('include', '/inventory.html');
  };

  const assertLoginError = (message) => {
    cy.contains('Epic sadface').should('be.visible');
    cy.get('[data-test="error"]')
      .should('contain.text', message);
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('Login com sucesso: e-mail e senha válidos', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
  });

  it('Login com sucesso: usuário e senha válidos', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
  });

  it('Login com sucesso: redirecionamento correto após login', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    cy.url().should('include', '/inventory.html');
  });

  it('Login com sucesso: sessão iniciada corretamente após autenticação', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
  });

  it('Login com sucesso: usuário permanece logado ao atualizar a página', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
    cy.reload();
    cy.url().should('include', '/inventory.html');
    cy.get('.title').should('contain.text', 'Products');
  });

  it('Login com dados inválidos: e-mail inválido', () => {
    cy.login('invalid-email', VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Login com dados inválidos: senha incorreta', () => {
    cy.login(VALID_USERNAME, 'wrong_password');
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Login com dados inválidos: usuário inexistente', () => {
    cy.login('nonexistent_user', VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Login com dados inválidos: senha vazia', () => {
    cy.login(VALID_USERNAME, '');
    assertLoginError(ERROR_PASSWORD_REQUIRED);
  });

  it('Login com dados inválidos: e-mail/usuário vazio', () => {
    cy.login('', VALID_PASSWORD);
    assertLoginError(ERROR_USERNAME_REQUIRED);
  });

  it('Login com dados inválidos: todos os campos vazios', () => {
    cy.login('', '');
    assertLoginError(ERROR_USERNAME_REQUIRED);
  });

  it('Validação de campos: formato de e-mail inválido', () => {
    cy.login('invalid-email-format', VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Validação de campos: limite mínimo de caracteres da senha', () => {
    cy.login(VALID_USERNAME, '123');
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Validação de campos: limite máximo de caracteres', () => {
    cy.login(VALID_USERNAME, 'a'.repeat(100));
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Validação de campos: espaços antes/depois do e-mail', () => {
    cy.login(` ${VALID_USERNAME} `, VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Validação de campos: caracteres especiais na senha', () => {
    cy.login(VALID_USERNAME, '@$%&*()!');
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });
});
