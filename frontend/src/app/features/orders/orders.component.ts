import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderDto } from '../../shared/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-8">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight">📦 Order History</h1>
          <p class="text-white/40 text-sm mt-1">All your orders saved in the database</p>
        </div>
        <button (click)="load()" class="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition">
          🔄 Refresh
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && orders().length === 0" class="text-center py-20 glass rounded-3xl">
        <div class="text-7xl mb-4">📦</div>
        <h2 class="text-2xl font-black text-white mb-2">No orders yet</h2>
        <p class="text-white/40 mb-8">Place your first order from the Pizza Builder or Compare page</p>
        <div class="flex gap-3 justify-center">
          <a routerLink="/builder" class="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-red-700 to-red-600 text-white hover:from-red-600 hover:to-red-500 transition">
            🍕 Build a Pizza
          </a>
        </div>
      </div>

      <!-- Orders Table -->
      <div *ngIf="!loading() && orders().length > 0" class="glass rounded-3xl overflow-hidden">
        <!-- Table Header Meta -->
        <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 class="text-base font-black text-white flex items-center gap-2">
            Orders
            <span class="text-xs text-white/40 font-normal">({{ orders().length }} record{{ orders().length > 1 ? 's' : '' }} in database)</span>
          </h2>
          <div class="flex gap-2">
            <span *ngFor="let s of statuses" (click)="filterStatus.set(s)"
              [class]="filterStatus() === s ? 'bg-red-600/30 text-red-300 border border-red-500/40' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white cursor-pointer'"
              class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer">
              {{ s === 'ALL' ? 'All' : s }}
            </span>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/10 bg-white/2">
                <th class="text-left px-5 py-3">Order #</th>
                <th class="text-left px-5 py-3">Restaurant</th>
                <th class="text-left px-5 py-3">Items</th>
                <th class="text-left px-5 py-3">Type</th>
                <th class="text-center px-5 py-3">Status</th>
                <th class="text-right px-5 py-3">Total</th>
                <th class="text-right px-5 py-3">Placed At</th>
                <th class="text-center px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let order of filteredOrders(); let i = index">
                <!-- Order Row -->
                <tr (click)="toggleExpand(order.id)"
                  class="border-b border-white/5 hover:bg-white/3 transition cursor-pointer group"
                  [class.bg-white-2]="expanded() === order.id">
                  <td class="px-5 py-4">
                    <span class="font-black text-red-400 text-xs">{{ order.orderNumber }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-white font-semibold text-xs">{{ order.restaurantName || '—' }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-white/60 text-xs">{{ order.items?.length || 0 }} item{{ (order.items?.length || 0) !== 1 ? 's' : '' }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-white/50 text-xs">
                      {{ order.deliveryType === 'STORE_DELIVERY' ? '🚚 Delivery' : '🏪 Pickup' }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-center">
                    <span [class]="statusClass(order.status)"
                      class="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <span class="font-black text-white text-sm">{{ order.total | currency }}</span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <span class="text-white/40 text-xs">{{ order.placedAt | date:'MMM d, h:mm a' }}</span>
                  </td>
                  <td class="px-5 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <a *ngIf="order.status === 'OUT_FOR_DELIVERY'" [routerLink]="['/orders/tracking', order.id]"
                        (click)="$event.stopPropagation()"
                        class="text-[9px] bg-blue-600/30 border border-blue-500/30 text-blue-300 px-2 py-1 rounded-lg font-bold hover:bg-blue-600/50 transition">
                        Track 🚴
                      </a>
                      <span class="text-white/20 text-lg group-hover:text-white/50 transition">
                        {{ expanded() === order.id ? '▲' : '▼' }}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Expanded Items Sub-Table -->
                <tr *ngIf="expanded() === order.id" class="bg-black/20">
                  <td colspan="8" class="px-5 py-4">
                    <div class="rounded-xl border border-white/10 overflow-hidden">
                      <div class="px-4 py-2 bg-white/5 border-b border-white/10">
                        <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">Order Items — {{ order.orderNumber }}</span>
                      </div>
                      <table class="w-full text-xs">
                        <thead>
                          <tr class="text-[9px] font-black uppercase tracking-widest text-white/20 border-b border-white/10">
                            <th class="text-left px-4 py-2">Item</th>
                            <th class="text-left px-4 py-2">Size / Crust</th>
                            <th class="text-left px-4 py-2">Toppings</th>
                            <th class="text-center px-4 py-2">Qty</th>
                            <th class="text-right px-4 py-2">Unit $</th>
                            <th class="text-right px-4 py-2">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let item of order.items" class="border-b border-white/5">
                            <td class="px-4 py-2.5 font-semibold text-white">{{ item.itemName }}</td>
                            <td class="px-4 py-2.5 text-white/50">
                              {{ item.size }}{{ item.crust ? ' · ' + item.crust : '' }}
                            </td>
                            <td class="px-4 py-2.5">
                              <div class="flex flex-wrap gap-1">
                                <span *ngFor="let t of item.toppings"
                                  class="bg-red-600/15 text-red-300 text-[8px] px-1.5 py-0.5 rounded-full border border-red-500/20 font-bold">
                                  {{ t }}
                                </span>
                                <span *ngIf="!item.toppings || item.toppings.length === 0" class="text-white/20">—</span>
                              </div>
                            </td>
                            <td class="px-4 py-2.5 text-center text-white/70">{{ item.quantity }}</td>
                            <td class="px-4 py-2.5 text-right text-white/60">{{ item.unitPrice | currency }}</td>
                            <td class="px-4 py-2.5 text-right font-bold text-white">{{ item.lineTotal | currency }}</td>
                          </tr>
                        </tbody>
                        <tfoot class="border-t border-white/10 bg-white/3">
                          <tr>
                            <td colspan="5" class="px-4 py-2 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Grand Total</td>
                            <td class="px-4 py-2 text-right font-black text-green-400">{{ order.total | currency }}</td>
                          </tr>
                        </tfoot>
                      </table>

                      <!-- DB record badge -->
                      <div class="px-4 py-2 bg-black/20 border-t border-white/5 flex items-center gap-2">
                        <span class="text-green-400 text-xs">✅</span>
                        <span class="text-[10px] text-white/30 font-mono">Database ID: {{ order.id }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add to cart CTA -->
      <div *ngIf="!loading() && orders().length > 0" class="flex justify-center">
        <a routerLink="/builder" class="px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition text-sm">
          🍕 Order Another Pizza
        </a>
      </div>

    </div>
  `
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  orders = signal<OrderDto[]>([]);
  loading = signal(true);
  expanded = signal<string | null>(null);
  filterStatus = signal('ALL');

  statuses = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  filteredOrders() {
    if (this.filterStatus() === 'ALL') return this.orders();
    return this.orders().filter(o => o.status === this.filterStatus());
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res.content ?? [];
        this.orders.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleExpand(id: string) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      PREPARING: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      OUT_FOR_DELIVERY: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      DELIVERED: 'bg-green-500/20 text-green-300 border border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };
    return map[status] ?? 'bg-white/10 text-white/50 border border-white/10';
  }
}
