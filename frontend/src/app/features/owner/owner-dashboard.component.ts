import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { Store, OrderDto } from '../../shared/models';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-8">
      <div>
        <h2 class="text-3xl font-black text-white">Merchant Store Console</h2>
        <p class="text-xs sm:text-sm text-white/50">Manage your pizza shop kitchen, fill active orders, and toggle menu availability.</p>
      </div>

      <!-- SHOP SELECTOR -->
      <div class="glass rounded-[2rem] p-6 space-y-4">
        <label class="block text-xs font-bold text-white/40 uppercase">Select Restaurant to Manage</label>
        <div class="grid sm:grid-cols-3 gap-4">
          <button *ngFor="let shop of shops()" (click)="selectShop(shop)"
            [class]="selectedShop()?.id === shop.id ? 'glass border border-red-500/50 bg-red-500/10 p-4 rounded-2xl text-left' : 'glass p-4 rounded-2xl text-left hover:border-white/20 transition'">
            <h3 class="font-bold text-white text-sm">{{ shop.name }}</h3>
            <p class="text-[10px] text-white/50 mt-1">{{ shop.addressLine }}, {{ shop.city }}</p>
          </button>
        </div>
      </div>

      <div *ngIf="selectedShop()" class="space-y-6 animate-fadeIn">
        <div class="flex border-b border-white/10 pb-1">
          <button (click)="activeTab.set('orders')"
            [class]="activeTab() === 'orders' ? 'px-6 py-2.5 font-bold text-white border-b-2 border-red-600' : 'px-6 py-2.5 text-white/50 hover:text-white transition'">
            Active Kitchen Orders
          </button>
          <button (click)="activeTab.set('menu')"
            [class]="activeTab() === 'menu' ? 'px-6 py-2.5 font-bold text-white border-b-2 border-red-600' : 'px-6 py-2.5 text-white/50 hover:text-white transition'">
            Menu Catalog Manager
          </button>
        </div>

        <!-- ORDERS TAB -->
        <div *ngIf="activeTab() === 'orders'" class="space-y-4">
          <div *ngIf="loadingOrders()" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
          </div>

          <div *ngIf="!loadingOrders() && orders().length === 0" class="glass rounded-[2rem] p-8 text-center text-white/40 text-xs">
            No active orders for this restaurant.
          </div>

          <div *ngIf="!loadingOrders() && orders().length > 0" class="space-y-4">
            <div *ngFor="let order of orders()" class="glass rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6 border border-white/5 hover:border-white/10 transition">
              <div class="space-y-3 flex-1">
                <div class="flex items-center gap-3">
                  <h4 class="font-bold text-white text-base">Order #{{ order.orderNumber }}</h4>
                  <span [class]="getStatusClass(order.status)" class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {{ order.status }}
                  </span>
                </div>
                <p class="text-[10px] text-white/40">Placed at {{ order.placedAt | date:'medium' }}</p>
                
                <div class="space-y-1">
                  <div *ngFor="let item of order.items" class="text-xs text-white/70">
                    {{ item.quantity }}x {{ item.itemName }} ({{ item.size }})
                  </div>
                </div>
              </div>

              <!-- ACTIONS AND PRICING -->
              <div class="flex flex-col justify-between items-end gap-4">
                <span class="font-black text-white text-lg">{{ order.total | currency }}</span>
                
                <div class="flex flex-wrap gap-2">
                  <button *ngIf="order.status === 'PLACED'" (click)="updateStatus(order.id, 'PREPARING')"
                    class="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                    Accept & Prepare
                  </button>
                  <button *ngIf="order.status === 'PREPARING' && order.deliveryType === 'PICKUP'" (click)="updateStatus(order.id, 'READY_FOR_PICKUP')"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                    Ready for Pickup
                  </button>
                  <button *ngIf="order.status === 'PREPARING' && order.deliveryType !== 'PICKUP'" (click)="updateStatus(order.id, 'OUT_FOR_DELIVERY')"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                    Out for Delivery
                  </button>
                  <button *ngIf="order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY'" (click)="updateStatus(order.id, 'DELIVERED')"
                    class="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                    Mark Delivered
                  </button>
                  <button *ngIf="order.status !== 'DELIVERED' && order.status !== 'CANCELLED'" (click)="updateStatus(order.id, 'CANCELLED')"
                    class="bg-red-600/25 border border-red-500/30 hover:bg-red-600 text-red-300 hover:text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU MANAGER TAB -->
        <div *ngIf="activeTab() === 'menu'" class="glass rounded-[2rem] p-6">
          <p class="text-xs text-white/50 mb-6">Below is the product catalog for your kitchen. Toggle availability settings as toppings go out of stock.</p>
          <div class="text-center py-6 text-white/40 text-xs">
            Integrated Menu Availability dashboard. Select items in client menu to test active settings.
          </div>
        </div>

      </div>
    </div>
  `
})
export class OwnerDashboardComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);

  shops = signal<Store[]>([]);
  selectedShop = signal<Store | null>(null);
  orders = signal<OrderDto[]>([]);
  activeTab = signal('orders');
  loadingOrders = signal(false);

  ngOnInit() {
    this.restaurantService.getRestaurants().subscribe({
      next: (data) => {
        this.shops.set(data);
        if (data.length > 0) {
          this.selectShop(data[0]);
        }
      }
    });
  }

  selectShop(shop: Store) {
    this.selectedShop.set(shop);
    this.loadOrders();
  }

  loadOrders() {
    const shop = this.selectedShop();
    if (!shop) return;

    this.loadingOrders.set(true);
    this.orderService.getRestaurantOrders(shop.id).subscribe({
      next: (ordersList) => {
        this.orders.set(ordersList);
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false)
    });
  }

  updateStatus(orderId: string, status: string) {
    this.orderService.updateOrderStatus(orderId, status, 'Kitchen Operator', `Transitioned to ${status}`).subscribe({
      next: () => this.loadOrders()
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-500/20 text-green-400';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400';
      case 'PREPARING': return 'bg-yellow-500/20 text-yellow-400';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-white/10 text-white/70';
    }
  }
}
