import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  notifications = signal<OrderNotification[]>([]);

  connect(restaurantId: string): void {
    if (this.client?.connected) {
      return;
    }

    const backendUrl = environment.apiUrl.replace('/api/v1', '');

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
      debug: (str) => console.log('[WebSocket]', str),
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.subscribe(restaurantId);
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame);
        this.handleReconnect();
      },
      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
      }
    });

    this.client.activate();
  }

  private subscribe(restaurantId: string): void {
    if (!this.client?.connected) {
      console.warn('[WebSocket] Not connected, cannot subscribe');
      return;
    }

    const destination = `/topic/restaurant/${restaurantId}/orders`;
    this.client.subscribe(destination, (message) => {
      try {
        const notification = JSON.parse(message.body) as OrderNotification;
        this.notifications.update(notifs => [...notifs, notification]);
        console.log('[WebSocket] Received notification:', notification);
      } catch (e) {
        console.error('[WebSocket] Failed to parse notification:', e);
      }
    });

    console.log('[WebSocket] Subscribed to', destination);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => {
        // Reconnect logic handled by client's reconnectDelay
      }, this.reconnectDelay);
    } else {
      console.error('[WebSocket] Max reconnect attempts reached');
    }
  }

  clearNotifications(): void {
    this.notifications.set([]);
  }

  disconnect(): void {
    if (this.client?.connected) {
      this.client.deactivate();
    }
  }
}
