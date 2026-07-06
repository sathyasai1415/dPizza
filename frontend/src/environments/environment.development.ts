export const environment = {
  production: false,
  /** Proxied to http://localhost:8080 by proxy.conf.json during `ng serve`. */
  apiUrl: '/api/v1',
  wsUrl: '/ws',
  /** Stripe test-mode publishable key (pk_test_...). Empty = checkout falls back to pay-at-store/COD only. */
  stripePublishableKey: '',
};
