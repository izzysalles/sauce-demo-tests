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

  it('Successful login: valid username and password', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
  });

  it('Successful login: correct user and password', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
  });

  it('Successful login: correct redirect after login', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    cy.url().should('include', '/inventory.html');
  });

  it('Successful login: session started correctly after authentication', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
  });

  it('Successful login: user stays logged in after page refresh', () => {
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    assertLoginSuccess();
    cy.reload();
    cy.url().should('include', '/inventory.html');
    cy.get('.title').should('contain.text', 'Products');
  });

  it('Invalid login: invalid username', () => {
    cy.login('invalid-email', VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Invalid login: incorrect password', () => {
    cy.login(VALID_USERNAME, 'wrong_password');
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Invalid login: nonexistent user', () => {
    cy.login('nonexistent_user', VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Invalid login: empty password', () => {
    cy.login(VALID_USERNAME, '');
    assertLoginError(ERROR_PASSWORD_REQUIRED);
  });

  it('Invalid login: empty username', () => {
    cy.login('', VALID_PASSWORD);
    assertLoginError(ERROR_USERNAME_REQUIRED);
  });

  it('Invalid login: all fields empty', () => {
    cy.login('', '');
    assertLoginError(ERROR_USERNAME_REQUIRED);
  });

  it('Field validation: invalid username format', () => {
    cy.login('invalid-email-format', VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Field validation: minimum password length', () => {
    cy.login(VALID_USERNAME, '123');
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Field validation: maximum password length', () => {
    cy.login(VALID_USERNAME, 'a'.repeat(100));
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Field validation: leading/trailing spaces in username', () => {
    cy.login(` ${VALID_USERNAME} `, VALID_PASSWORD);
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });

  it('Field validation: special characters in password', () => {
    cy.login(VALID_USERNAME, '@$%&*()!');
    assertLoginError(ERROR_INVALID_CREDENTIALS);
  });
});
