import { Injectable, signal, computed } from '@angular/core';

export type AlertType = 'Orders' | 'Payments' | 'Deals' | 'System' | 'Menu Updates';
export interface MerchantAlert {
  id: string;
  type: AlertType;
  icon: string;
  title: string;
  detail: string;
}

/**
 * Shared source of merchant notifications. The owner dashboard derives alerts from
 * the store's real orders/reviews/deals and pushes them here; the top-nav bell
 * (in the layout) reads them. No mock data — everything is computed from live data.
 */
@Injectable({ providedIn: 'root' })
export class MerchantAlertsService {
  readonly alerts = signal<MerchantAlert[]>([]);
  private readonly readIds = signal<Set<string>>(new Set());

  readonly unreadCount = computed(() => this.alerts().filter(a => !this.readIds().has(a.id)).length);

  setAlerts(list: MerchantAlert[]) {
    this.alerts.set(list);
  }

  isRead(id: string): boolean { return this.readIds().has(id); }

  markAllRead() {
    this.readIds.set(new Set(this.alerts().map(a => a.id)));
  }

  clear() {
    this.alerts.set([]);
    this.readIds.set(new Set());
  }
}
