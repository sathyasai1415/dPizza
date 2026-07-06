export const environment = {
  production: true,
  /** Base URL for the MiSlice REST API. */
  apiUrl: '/api/v1',
  /** WebSocket (STOMP over SockJS) endpoint. */
  wsUrl: '/ws',
  /** Stripe publishable key — safe to expose; set per deployment. */
  stripePublishableKey: '',
};
