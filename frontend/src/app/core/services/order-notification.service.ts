import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RxStomp } from '@stomp/rx-stomp';
import { take } from 'rxjs';

export interface OrderNotification {
  event: string;
  orderNumber: string;
  orderId: string;
  itemCount?: number;
  total?: number;
  placedAt?: string;
  estimatedEtaMin?: number;
  estimatedEtaMax?: number;
  status?: string;
  deliveryType?: string;
  previousStatus?: string;
  newStatus?: string;
  changedAt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderNotificationService {
  private rxStomp = new RxStomp();
  private isConnected = false;

  notifications = signal<OrderNotification[]>([]);

  connect(restaurantId: string): void {
    if (this.isConnected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const wsUrl = `ws://${window.location.hostname}:8080/ws`;

    this.rxStomp.configure({
      brokerURL: wsUrl,
      connectHeaders: {},
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 3000,
      debug: (msg: string) => console.log('[WebSocket Debug]', msg)
    });

    this.rxStomp.activate();

    this.rxStomp.connected$.pipe(take(1)).subscribe((connected) => {
      if (connected) {
        console.log('[WebSocket] Connected');
        this.isConnected = true;
        this.subscribe(restaurantId);
      }
    });
  }

  private subscribe(restaurantId: string): void {
    const destination = `/topic/restaurant/${restaurantId}/orders`;

    this.rxStomp.watch(destination).subscribe({
      next: (message) => {
        try {
          const notification = JSON.parse(message.body) as OrderNotification;
          this.notifications.update(notifs => [...notifs, notification]);
          console.log('[WebSocket] Received notification:', notification);
        } catch (e) {
          console.error('[WebSocket] Failed to parse notification:', e);
        }
      },
      error: (err) => {
        console.error('[WebSocket] Subscription error:', err);
      }
    });

    console.log('[WebSocket] Subscribed to', destination);
  }

  clearNotifications(): void {
    this.notifications.set([]);
  }

  disconnect(): void {
    if (this.isConnected) {
      this.rxStomp.deactivate();
      this.isConnected = false;
    }
  }
}
