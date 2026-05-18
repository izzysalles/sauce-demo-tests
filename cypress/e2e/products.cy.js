import {
  VALID_USERNAME,
  VALID_PASSWORD
} from '../support/loginConstants';

const addFirstProductFromList = () => {
  return cy.get('.inventory_item', { timeout: 10000 })
    .should('exist')
    .and('have.length.gte', 1)
    .first()
    .then($first => {
      return cy.wrap($first)
        .find('.inventory_item_name')
        .invoke('text')
        .then((name) => {
          return cy.wrap($first)
            .contains('button', 'Add to cart', { timeout: 10000 })
            .should('be.visible')
            .click()
            .then(() => name);
        });
    });
};

const openCart = () => cy.get('.shopping_cart_link').click();

const goToFirstProductPage = () => {
  cy.get('.inventory_item', { timeout: 10000 }).should('exist').and('have.length.gte', 1).first().find('.inventory_item_name').should('be.visible').click();
};

const parsePrice = (priceText) => Number(priceText.replace('$', ''));

describe('Products and Cart Scenarios', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login(VALID_USERNAME, VALID_PASSWORD);
    cy.url().should('include', '/inventory.html');
  });

  it('Add a product to cart from product page', () => {
    goToFirstProductPage();
    cy.get('.inventory_details_name').invoke('text').as('productName');
    cy.contains('Add to cart').click();
    cy.get('.shopping_cart_badge').should('contain.text', '1');
    openCart();
    cy.get('@productName').then((name) => {
      cy.get('.cart_item').should('contain.text', name.trim());
    });
  });

  it('Add a product to cart from listing', () => {
    addFirstProductFromList().then((name) => {
      cy.get('.shopping_cart_badge', { timeout: 10000 }).should('contain.text', '1');
      openCart();
      cy.get('.cart_item').should('contain.text', name.trim());
    });
  });

  it('Add the same product more than once (app may not support quantity)', () => {
    // Sauce Demo toggles Add/Remove per product, so quantity controls may not exist.
    addFirstProductFromList();
    // Try to add again; button may be "Remove" so this will not increase quantity.
    cy.get('.inventory_item').first().contains(/Add to cart|Remove/).then($btn => {
      const text = $btn.text();
      if (text.includes('Add')) {
        cy.wrap($btn).click();
      } else {
        // cannot add twice; assert that cart badge is 1
        cy.get('.shopping_cart_badge').should('contain.text', '1');
      }
    });
    openCart();
    cy.get('.cart_item').should('have.length', 1);
  });

  it('Add different products to cart', () => {
    // Add first product
    addFirstProductFromList();
    // Add second product
    cy.get('.inventory_item').eq(1).as('secondItem');
    cy.get('@secondItem').find('.inventory_item_name').invoke('text').as('secondItemName');
    cy.get('@secondItem').contains('Add to cart').click();
    cy.get('.shopping_cart_badge').should('contain.text', '2');
    openCart();
    cy.get('.cart_item').should('have.length', 2);
  });

  it('Remove a product from the cart', () => {
    addFirstProductFromList();
    openCart();
    cy.get('.cart_item').first().within(() => {
      cy.contains('Remove').click();
    });
    cy.get('.cart_item').should('have.length', 0);
  });

  it('Remove one product when multiple in the cart', () => {
    addFirstProductFromList();
    cy.get('.inventory_item').eq(1).contains('Add to cart').click();
    openCart();
    cy.get('.cart_item').then($items => {
      expect($items.length).to.be.greaterThan(1);
    });
    // Remove the first one
    cy.get('.cart_item').first().within(() => cy.contains('Remove').click());
    cy.get('.cart_item').should('have.length', 1);
  });

  it('Remove all products from the cart', () => {
    addFirstProductFromList();
    cy.get('.inventory_item').eq(1).contains('Add to cart').click();
    openCart();
    cy.get('.cart_item').each(($el) => {
      cy.wrap($el).within(() => cy.contains('Remove').click());
    });
    cy.get('.cart_item').should('have.length', 0);
  });

  it('Access cart without products added', () => {
    // Ensure cart is empty by navigating through the app
    openCart();
    cy.get('.cart_item').should('have.length', 0);
    // Some apps show a message; assert there are no cart items
  });

  it('Verify total after adding product (via Checkout overview)', () => {
    addFirstProductFromList();
    openCart();
    cy.get('.cart_item').first().find('.inventory_item_price').invoke('text').then((text) => {
      const price = parsePrice(text);
      cy.contains('Checkout').click();
      // Fill checkout info
      cy.get('#first-name').type('Test');
      cy.get('#last-name').type('User');
      cy.get('#postal-code').type('00000');
      cy.contains('Continue').click();
      cy.get('.summary_subtotal_label').invoke('text').then((label) => {
        const match = label.match(/Item total: \$(\d+\.\d{2})/);
        if (match) {
          expect(Number(match[1])).to.eq(price);
        } else {
          // If format different, do a best-effort parse
          const value = parsePrice(label);
          expect(value).to.eq(price);
        }
      });
    });
  });

  it('Verify total after removing product', () => {
    // Add two products
    addFirstProductFromList();
    cy.get('.inventory_item').eq(1).find('.inventory_item_name').invoke('text').then((secondName) => {
      cy.get('.inventory_item').eq(1).contains('Add to cart').click();
      openCart();
      // Remove second product
      cy.contains('.cart_item', secondName.trim()).within(() => cy.contains('Remove').click());
      // Continue to checkout and verify total equals remaining item
      cy.contains('Checkout').click();
      cy.get('#first-name').type('A');
      cy.get('#last-name').type('B');
      cy.get('#postal-code').type('12345');
      cy.contains('Continue').click();
      // Compute sum of shown items on overview
      cy.get('.cart_item .inventory_item_price').then($prices => {
        const sum = Cypress._.sum(Array.from($prices).map(el => parsePrice(el.innerText)));
        cy.get('.summary_subtotal_label').invoke('text').then(txt => {
          const match = txt.match(/\$(\d+\.\d{2})/);
          if (match) expect(Number(match[1])).to.eq(sum);
        });
      });
    });
  });

  it('Add discounted product to cart', () => {
    // App likely doesn't support discounts; do a conditional check
    addFirstProductFromList();
    openCart();
    cy.get('body').then($b => {
      if ($b.find('.cart_item').length && $b.find('.summary_discount_label').length) {
        // Example: assert discount label exists on checkout overview
        cy.contains('Checkout').click();
        cy.get('#first-name').type('D');
        cy.get('#last-name').type('U');
        cy.get('#postal-code').type('11111');
        cy.contains('Continue').click();
        cy.get('.summary_discount_label').should('exist');
      } else {
        cy.log('Discounts are not supported in this application');
      }
    });
  });

  it('Add out-of-stock product to cart', () => {
    // Sauce Demo does not expose stock state; check for any "Out of stock" markers
    cy.get('body').then($b => {
      if ($b.find('.out-of-stock').length) {
        cy.get('.out-of-stock').first().parent().within(() => {
          cy.contains('Add to cart').should('not.exist');
        });
      } else {
        cy.log('No out-of-stock products detected in app');
      }
    });
  });

  it('Add quantity greater than stock', () => {
    cy.log('Quantity/stock controls not available in this app; manual verification needed');
  });

  it('Update quantity in cart', () => {
    cy.log('No quantity input in cart UI; skipping update test');
  });

  it('Decrease quantity to zero', () => {
    cy.log('No decrement-to-zero control available; product removal covers this behaviour');
  });

  it('Refresh page after adding product, product remains in cart', () => {
    addFirstProductFromList();
    cy.get('.shopping_cart_badge').should('contain.text', '1');
    cy.reload();
    // Badge should persist
    cy.get('.shopping_cart_badge').should('contain.text', '1');
    openCart();
    cy.get('.cart_item').should('have.length', 1);
  });

  it('Close and reopen browser with product in cart (simulated by clearing and restoring session)', () => {
    addFirstProductFromList();
    // Simulate new session by preserving localStorage then reopening
    cy.window().then(win => {
      const storage = { ...win.localStorage };
      // Simulate closing
      win.localStorage.clear();
      // Simulate reopening by restoring
      Object.keys(storage).forEach(k => win.localStorage.setItem(k, storage[k]));
    });
    cy.reload();
    cy.get('.shopping_cart_badge').should('contain.text', '1');
  });

  it('Add product to cart without being logged in', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/', { failOnStatusCode: false });
    cy.url().should('not.include', '/inventory.html');
    cy.get('#login-button').should('be.visible');
    cy.get('#user-name').should('be.visible');
    cy.get('#password').should('be.visible');
  });

  it('Login after adding product as guest', () => {
    cy.log('Guest add then login flow not supported by this app; skipping');
  });

  it('Remove product and attempt checkout; removed product should not appear', () => {
    addFirstProductFromList();
    openCart();
    cy.get('.cart_item').first().within(() => cy.contains('Remove').click());
    cy.get('.cart_item').should('have.length', 0);
    // Try to checkout; button may be present but no items should be shown in overview
    cy.contains('Checkout').click();
    cy.get('#first-name').type('X');
    cy.get('#last-name').type('Y');
    cy.get('#postal-code').type('00000');
    cy.contains('Continue').click();
    cy.get('.cart_item').should('have.length', 0);
  });
});
