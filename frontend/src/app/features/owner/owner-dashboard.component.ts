import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { Store, OrderDto } from '../../shared/models';

interface StoreCoupon { code: string; discount: number; minSpend: number; active: boolean; }
interface MenuItem { id: string; name: string; price: number; inStock: boolean; category: string; }

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-6xl mx-auto py-6 space-y-6">
      
      <!-- HEADER & STATUS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-black text-white">Merchant Store Console</h2>
          <p class="text-xs text-white/50">Manage your pizza shop kitchen, fill active orders, and toggle menu availability.</p>
        </div>

        <!-- Online ordering toggle -->
        <div class="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-white/5 shrink-0 self-start sm:self-center">
          <span class="text-xs font-bold" [class.text-emerald-400]="online()" [class.text-white/40]="!online()">
            {{ online() ? '🟢 Accepting Orders' : '🔴 Closed / Offline' }}
          </span>
          <button (click)="online.set(!online())"
            [class]="'w-9 h-5 rounded-full relative transition ' + (online() ? 'bg-emerald-500' : 'bg-white/15')">
            <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" [style.left]="online() ? '18px' : '2px'"></span>
          </button>
        </div>
      </div>

      <!-- RESTAURANT SELECTOR -->
      <div class="glass rounded-[2rem] p-5 space-y-3">
        <label class="block text-xs font-black text-white/40 uppercase tracking-wider">Select Restaurant to Manage</label>
        <div class="grid sm:grid-cols-3 gap-3">
          <button *ngFor="let shop of shops()" (click)="selectShop(shop)"
            [class]="selectedShop()?.id === shop.id ? 'glass border border-red-500/50 bg-red-500/10 p-4 rounded-2xl text-left' : 'glass p-4 rounded-2xl text-left hover:border-white/20 transition'">
            <h3 class="font-bold text-white text-sm">{{ shop.name }}</h3>
            <p class="text-[10px] text-white/40 mt-1">{{ shop.addressLine }}, {{ shop.city }}</p>
          </button>
        </div>
      </div>

      <!-- MAIN TABS LAYOUT -->
      <div *ngIf="selectedShop()" class="grid md:grid-cols-[220px_1fr] gap-6 items-start">
        <!-- Sidebar Navigation -->
        <div class="flex flex-col gap-1.5">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
              [class]="'w-full text-left px-4 py-3 rounded-2xl text-xs font-black transition flex items-center gap-3 ' + 
                (activeTab() === tab.id 
                  ? 'bg-gradient-to-r from-red-700/80 to-red-600/50 text-white border border-red-500/30' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white')">
              <span>{{ tab.icon }}</span>
              {{ tab.name }}
            </button>
          }
        </div>

        <!-- Selected Tab view content -->
        <div class="glass rounded-[2rem] p-6 min-h-[400px] border border-white/5 bg-black/20">
          
          <!-- TAB 1: OVERVIEW -->
          <div *ngIf="activeTab() === 'overview'" class="space-y-6">
            <h3 class="text-lg font-black text-white">📊 Performance Dashboard</h3>
            
            <!-- KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">📦</span>
                <p class="text-xl font-black text-white mt-1">{{ orders().length }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Total Orders</p>
              </div>
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">💰</span>
                <p class="text-xl font-black text-white mt-1">{{ netEarnings() | currency }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Net Revenue</p>
              </div>
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">🔥</span>
                <p class="text-xl font-black text-white mt-1">{{ activeOrders() }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Active Kitchen</p>
              </div>
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">★</span>
                <p class="text-xl font-black text-white mt-1">{{ selectedShop()?.ratingAvg || 4.5 }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Shop Rating</p>
              </div>
            </div>

            <!-- Onboarding Checklist -->
            <div class="glass-soft rounded-2xl p-5 border border-white/5 space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 class="text-xs font-black uppercase text-white/50 tracking-wider">📋 Partner Onboarding Tasks</h4>
                <span class="text-[10px] font-black bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-md">80% Done</span>
              </div>
              <div class="space-y-2.5 text-xs text-white/70">
                <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Create store profile & address details</div>
                <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Set minimum order amount and radius</div>
                <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Upload menu catalog & set pricing</div>
                <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Add initial store discount deal</div>
                <div class="flex items-center gap-2 text-white/40"><span class="text-yellow-400">⏳</span> Pass platform verification review</div>
              </div>
            </div>
          </div>

          <!-- TAB 2: ORDERS MANAGER -->
          <div *ngIf="activeTab() === 'orders'" class="space-y-4">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="text-lg font-black text-white">📦 Active Kitchen Orders</h3>
              <!-- Sub-tabs -->
              <div class="flex gap-1 bg-white/5 p-1 rounded-xl">
                <button *ngFor="let mode of ['active', 'history']" (click)="orderSubTab.set(mode)"
                  [class]="'px-3 py-1 rounded-lg text-[10px] font-black capitalize ' + (orderSubTab() === mode ? 'bg-red-600 text-white shadow-sm' : 'text-white/50 hover:text-white')">
                  {{ mode }}
                </button>
              </div>
            </div>

            <div *ngIf="loadingOrders()" class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
            </div>

            <div *ngIf="!loadingOrders() && filteredOrders().length === 0" class="text-center py-12 text-white/40 text-xs">
              No orders found in this section.
            </div>

            <div *ngIf="!loadingOrders() && filteredOrders().length > 0" class="space-y-3">
              <div *ngFor="let order of filteredOrders()" class="glass rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-white text-sm">Order #{{ order.orderNumber }}</h4>
                    <span [class]="getStatusClass(order.status)" class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {{ order.status }}
                    </span>
                  </div>
                  <p class="text-[10px] text-white/40">{{ order.placedAt | date:'medium' }}</p>
                  
                  <div class="space-y-1">
                    <div *ngFor="let item of order.items" class="text-xs text-white/70">
                      🍕 {{ item.quantity }}x {{ item.itemName }} ({{ item.size }})
                    </div>
                  </div>
                </div>

                <div class="flex flex-col justify-between items-end gap-3">
                  <span class="font-black text-white text-base">{{ order.total | currency }}</span>
                  <div class="flex gap-2">
                    <button *ngIf="order.status === 'PENDING' || order.status === 'PLACED'" (click)="updateStatus(order.id, 'PREPARING')"
                      class="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                      Accept &amp; Prepare
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: MENU MANAGER -->
          <div *ngIf="activeTab() === 'menu'" class="space-y-4">
            <h3 class="text-lg font-black text-white">🍕 Menu Catalog Manager</h3>
            <p class="text-xs text-white/50">Update pricing and toggle stock statuses. Changes reflect live on customer search results.</p>
            
            <div class="space-y-2 pt-2">
              <div *ngFor="let item of menuItems()" class="glass rounded-xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-bold text-white">{{ item.name }}</h4>
                  <span class="text-[9px] bg-white/5 text-white/40 px-2 py-0.5 rounded uppercase font-black tracking-wider">{{ item.category }}</span>
                </div>
                
                <div class="flex items-center gap-4">
                  <!-- price input -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-white/40">$</span>
                    <input type="number" [(ngModel)]="item.price"
                      class="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center text-white outline-none focus:border-red-500" />
                  </div>
                  <!-- toggle stock -->
                  <button (click)="item.inStock = !item.inStock"
                    [class]="'px-3 py-1 rounded-lg text-[10px] font-bold transition ' + (item.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')">
                    {{ item.inStock ? 'In Stock' : 'Out of Stock' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: DEALS MANAGER -->
          <div *ngIf="activeTab() === 'deals'" class="space-y-4">
            <h3 class="text-lg font-black text-white">🏷️ Store Coupon Deals</h3>
            <p class="text-xs text-white/50">Set up custom discounts and BOGO offers to attract local pizza buyers.</p>

            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Add Coupon Form -->
              <div class="glass rounded-2xl p-4 border border-white/5 space-y-3">
                <h4 class="text-xs font-bold text-white/50 uppercase">Create New Deal</h4>
                <div class="space-y-2 text-xs">
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Coupon Code</label>
                    <input type="text" [(ngModel)]="newCoupon.code" placeholder="e.g. SHAMZ20"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/40 mb-1">Discount %</label>
                      <input type="number" [(ngModel)]="newCoupon.discount" placeholder="20"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/40 mb-1">Min Spend $</label>
                      <input type="number" [(ngModel)]="newCoupon.minSpend" placeholder="15"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                    </div>
                  </div>
                  <button (click)="addCoupon()"
                    class="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition">
                    Create Deal 🏷️
                  </button>
                </div>
              </div>

              <!-- Active Coupons List -->
              <div class="space-y-2">
                <div *ngFor="let coupon of coupons()" class="glass rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <span class="font-black text-white uppercase bg-white/5 px-2 py-0.5 rounded">{{ coupon.code }}</span>
                    <p class="text-[10px] text-white/50 mt-1">{{ coupon.discount }}% off · Min spend {{ coupon.minSpend | currency }}</p>
                  </div>
                  <button (click)="coupon.active = !coupon.active"
                    [class]="'px-2 py-1 rounded text-[10px] font-bold ' + (coupon.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')">
                    {{ coupon.active ? 'Active' : 'Disabled' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: AI INSIGHTS -->
          <div *ngIf="activeTab() === 'insights'" class="space-y-4">
            <h3 class="text-lg font-black text-white">🤖 Weekly Gemini Business Insights</h3>
            
            <div class="space-y-4">
              <div class="glass-soft rounded-2xl p-5 border border-red-500/20 space-y-2.5">
                <p class="text-xs font-black text-red-400 uppercase tracking-widest">🔥 Demand Spike Alert</p>
                <p class="text-xs text-white/70 leading-relaxed">
                  Sales data shows a **34% week-over-week increase** in demand for extra-cheese and bacon toppings in the Detroit region.
                </p>
              </div>

              <div class="glass-soft rounded-2xl p-5 border border-blue-500/20 space-y-2.5">
                <p class="text-xs font-black text-blue-400 uppercase tracking-widest">⏱️ Delivery Logistics</p>
                <p class="text-xs text-white/70 leading-relaxed">
                  Your kitchen average prep time during Friday rush is **18.2 minutes** — keeping you highly competitive compared to national chains (avg 26 min).
                </p>
              </div>

              <div class="glass-soft rounded-2xl p-5 border border-orange-500/20 space-y-2.5">
                <p class="text-xs font-black text-orange-400 uppercase tracking-widest">💡 Pricing Recommendations</p>
                <p class="text-xs text-white/70 leading-relaxed">
                  Jet's deep dish large is priced at $16.99. Setting your custom deep dish crust at **$13.99** puts you in the prime "cheapest option" slot for local search result grids.
                </p>
              </div>
            </div>
          </div>

          <!-- TAB 6: SETTINGS -->
          <div *ngIf="activeTab() === 'settings'" class="space-y-4">
            <h3 class="text-lg font-black text-white">⚙️ Store Settings &amp; Profile</h3>
            
            <div class="grid sm:grid-cols-2 gap-4 text-xs">
              <div class="space-y-3">
                <div>
                  <label class="block text-[10px] text-white/40 mb-1">Store Name</label>
                  <input type="text" [value]="selectedShop()?.name" disabled
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/40 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label class="block text-[10px] text-white/40 mb-1">Store Address</label>
                  <input type="text" [value]="selectedShop()?.addressLine" disabled
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/40 cursor-not-allowed outline-none" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Minimum Order ($)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.minimumOrder"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Avg Prep Time (min)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.averageEtaMinutes"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                </div>
              </div>

              <!-- Holiday Hours -->
              <div class="glass-soft rounded-2xl p-4 border border-white/5 space-y-3">
                <h4 class="text-xs font-bold text-white/50 uppercase">Holiday / Working Hours</h4>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span class="font-bold text-white">11:00 AM - 11:00 PM</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Saturday - Sunday:</span>
                    <span class="font-bold text-white">12:00 PM - 02:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class OwnerDashboardComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);

  shops = signal<Store[]>([]);
  selectedShop = signal<Store | null>(null);
  orders = signal<OrderDto[]>([]);
  activeTab = signal('overview');
  orderSubTab = signal('active');
  loadingOrders = signal(false);
  online = signal(true);

  tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'orders', name: 'Orders Manager', icon: '📦' },
    { id: 'menu', name: 'Menu & Prices', icon: '🍕' },
    { id: 'deals', name: 'Deals Manager', icon: '🏷️' },
    { id: 'insights', name: 'AI Insights', icon: '🤖' },
    { id: 'settings', name: 'Store Settings', icon: '⚙️' }
  ];

  menuItems = signal<MenuItem[]>([
    { id: '1', name: 'Detroit Square Cheese', price: 9.99, inStock: true, category: 'pizzas' },
    { id: '2', name: 'Sathya Extra Spicy Supreme', price: 12.99, inStock: true, category: 'pizzas' },
    { id: '3', name: 'Gluten Free Thin Crust Veggie', price: 11.49, inStock: false, category: 'pizzas' },
    { id: '4', name: 'Bacon Double Pepperoni', price: 13.99, inStock: true, category: 'pizzas' }
  ]);

  coupons = signal<StoreCoupon[]>([
    { code: 'BOGO_TUESDAY', discount: 50, minSpend: 15, active: true },
    { code: 'SHAMZ5', discount: 20, minSpend: 10, active: true }
  ]);

  newCoupon = { code: '', discount: 20, minSpend: 10 };

  // KPI computeds (React store-owner overview parity)
  netEarnings = computed(() =>
    this.orders().reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 0.8); // after 20% platform fee
  activeOrders = computed(() =>
    this.orders().filter(o => ['placed', 'confirmed', 'preparing', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length);
  
  filteredOrders = computed(() => {
    const list = this.orders();
    if (this.orderSubTab() === 'active') {
      return list.filter(o => !['delivered', 'cancelled', 'DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase()));
    } else {
      return list.filter(o => ['delivered', 'cancelled', 'DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase()));
    }
  });

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

  addCoupon() {
    const code = this.newCoupon.code.trim().toUpperCase();
    if (!code) return;
    this.coupons.update(list => [...list, { ...this.newCoupon, code, active: true }]);
    this.newCoupon = { code: '', discount: 20, minSpend: 10 };
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
