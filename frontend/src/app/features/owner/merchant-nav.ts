// Shared merchant-portal navigation definition, used by both the app sidebar
// (layout.component) and the dashboard content (owner-dashboard.component).
export interface MerchantTab { id: string; name: string; icon: string; }

export const MERCHANT_TABS: MerchantTab[] = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'orders', name: 'Orders', icon: '📦' },
  { id: 'menu', name: 'Menu', icon: '🍕' },
  { id: 'deals', name: 'Deals', icon: '🏷️' },
  { id: 'financials', name: 'Financials', icon: '💳' },
  { id: 'delivery', name: 'Delivery', icon: '🛵' },
  { id: 'reviews', name: 'Reviews', icon: '⭐' },
  { id: 'users', name: 'Users', icon: '👥' },
  { id: 'insights', name: 'AI Insights', icon: '🤖' },
  { id: 'settings', name: 'Settings', icon: '⚙️' },
];
