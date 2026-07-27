import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
    <div class="min-h-screen bg-transparent text-white pb-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <!-- HEADER & FILTERS -->
        <header class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-black tracking-tight text-[#D4AF37]">My Orders</h1>
              <p class="text-neutral-300 text-sm mt-1 font-medium">Track active orders, view receipts, reorder your favorites, and manage purchases.</p>
            </div>
            
            <div class="relative w-full md:w-72">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search orders..." 
                class="w-full bg-[#0A0A0A] border border-[#D4AF37]/35 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] text-white placeholder-neutral-500 shadow-sm transition-all" />
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          <!-- Quick Filters -->
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let f of filters" (click)="activeFilter.set(f)"
              [class]="activeFilter() === f 
                ? 'bg-[#D4AF37] text-black font-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/20' 
                : 'bg-[#1C0338] text-white font-bold border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10'"
              class="px-4 py-1.5 rounded-full text-xs border transition-all">
              {{ f }}
            </button>
          </div>
        </header>

        <div *ngIf="loading()" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-[#D4AF37]"></div>
        </div>

        <div *ngIf="!loading()" class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <!-- LEFT COLUMN: Main Orders Area -->
          <div class="lg:col-span-2 space-y-8">

            <!-- ACTIVE ORDER HERO -->
            <div *ngIf="activeOrder() as active" class="bg-[#1C0338] rounded-[24px] border border-[#D4AF37] overflow-hidden transform transition-all animate-fadeIn shadow-xl">
              
              <!-- Hero Header -->
              <div class="bg-gradient-to-r from-[#2D0B5A] to-[#120227] border-b border-[#D4AF37]/25 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="bg-[#D4AF37] text-black px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Active Order</span>
                    <span class="text-neutral-300 text-xs font-medium font-mono">#{{ active.orderNumber }}</span>
                  </div>
                  <h2 class="text-2xl font-black text-[#D4AF37]">{{ active.restaurantName }}</h2>
                  <p class="text-neutral-200 text-sm font-medium mt-1">{{ active.deliveryType === 'STORE_DELIVERY' ? '🚚 Delivery' : '🏪 Pickup' }}</p>
                </div>
                
                <div class="bg-[#0A0A0A] text-[#D4AF37] border border-[#D4AF37]/35 px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center min-w-[140px]">
                  <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Estimated Arrival</span>
                  <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-black text-[#D4AF37] animate-pulse">18</span>
                    <span class="text-sm font-bold text-neutral-400">mins</span>
                  </div>
                  <span class="text-[10px] font-bold text-[#D4AF37] mt-1 bg-[#1C0338]/85 px-2 py-0.5 rounded-full">ETA 6:42 PM</span>
                </div>
              </div>

              <div class="p-6 md:p-8 space-y-8">
                
                <!-- Timeline Tracker -->
                <div>
                  <h3 class="text-sm font-black text-white uppercase tracking-wider mb-4">Live Tracking</h3>
                  <div class="relative">
                    <!-- Progress Line background -->
                    <div class="absolute top-4 left-4 right-4 h-1 bg-neutral-800 rounded-full z-0"></div>
                    <!-- Progress Line active -->
                    <div class="absolute top-4 left-4 h-1 bg-[#D4AF37] rounded-full z-0 transition-all duration-1000 ease-in-out" 
                      [style.width.%]="trackerProgress(active.status)"></div>
                    
                    <div class="relative z-10 flex justify-between">
                      <!-- Placed -->
                      <div class="flex flex-col items-center gap-2 w-16">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs" [class]="active.status ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/35' : 'bg-[#0A0A0A] border border-[#D4AF37]/20 text-neutral-500'">✓</div>
                        <span class="text-[10px] font-bold text-center" [class]="active.status ? 'text-white' : 'text-neutral-400'">Placed</span>
                      </div>
                      <!-- Confirmed -->
                      <div class="flex flex-col items-center gap-2 w-16">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs" [class]="trackerProgress(active.status) >= 25 ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/35' : 'bg-[#0A0A0A] border border-[#D4AF37]/20 text-neutral-500'">✓</div>
                        <span class="text-[10px] font-bold text-center" [class]="trackerProgress(active.status) >= 25 ? 'text-white' : 'text-neutral-400'">Confirmed</span>
                      </div>
                      <!-- Preparing -->
                      <div class="flex flex-col items-center gap-2 w-16">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs" [class]="trackerProgress(active.status) >= 50 ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/35' : 'bg-[#0A0A0A] border border-[#D4AF37]/20 text-neutral-500'">{{ trackerProgress(active.status) >= 50 ? '🔥' : '○' }}</div>
                        <span class="text-[10px] font-bold text-center" [class]="trackerProgress(active.status) >= 50 ? 'text-white' : 'text-neutral-400'">Baking</span>
                      </div>
                      <!-- Out for Delivery -->
                      <div class="flex flex-col items-center gap-2 w-16">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs" [class]="trackerProgress(active.status) >= 75 ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/35' : 'bg-[#0A0A0A] border border-[#D4AF37]/20 text-neutral-500'">{{ trackerProgress(active.status) >= 75 ? '🚗' : '○' }}</div>
                        <span class="text-[10px] font-bold text-center" [class]="trackerProgress(active.status) >= 75 ? 'text-white' : 'text-neutral-400'">On the way</span>
                      </div>
                      <!-- Delivered -->
                      <div class="flex flex-col items-center gap-2 w-16">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center bg-[#0A0A0A] border border-[#D4AF37]/20 text-neutral-500 text-xs transition-colors">○</div>
                        <span class="text-[10px] font-bold text-center text-neutral-400">Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Driver & Order Details Split -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#D4AF37]/20">
                  
                  <!-- Left Side: Live Driver (Mocked) -->
                  <div *ngIf="active.deliveryType === 'STORE_DELIVERY'" class="bg-[#0A0A0A] rounded-2xl p-4 border border-[#D4AF37]/20">
                    <h4 class="text-xs font-black text-neutral-400 uppercase tracking-wider mb-3">Your Driver</h4>
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-[#1C0338] border border-[#D4AF37]/35 flex items-center justify-center text-xl overflow-hidden relative">
                          <span class="relative z-10">👱‍♂️</span>
                          <div class="absolute inset-0 bg-[#D4AF37]/20 animate-pulse opacity-50"></div>
                        </div>
                        <div>
                          <p class="font-bold text-white text-sm">Alex M.</p>
                          <p class="text-xs text-neutral-300">Honda Civic • 0.8 mi away</p>
                        </div>
                      </div>
                      <div class="bg-[#1C0338] text-[#D4AF37] px-2.5 py-1 rounded-lg text-xs font-bold border border-[#D4AF37]/30 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping absolute"></span>
                        <span class="w-2 h-2 rounded-full bg-[#D4AF37] relative"></span>
                        Live
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button class="flex-1 py-2 bg-[#1C0338] border border-[#D4AF37]/30 rounded-xl text-xs font-bold text-white shadow-sm hover:bg-[#D4AF37]/10 transition">Call</button>
                      <button class="flex-1 py-2 bg-[#1C0338] border border-[#D4AF37]/30 rounded-xl text-xs font-bold text-white shadow-sm hover:bg-[#D4AF37]/10 transition">Message</button>
                      <button class="flex-1 py-2 bg-[#D4AF37] text-black rounded-xl text-xs font-bold shadow-sm hover:brightness-110 transition">Map</button>
                    </div>
                  </div>

                  <!-- Right Side: Order Receipt Mini -->
                  <div class="space-y-3" [class.md:col-span-2]="active.deliveryType !== 'STORE_DELIVERY'">
                    <h4 class="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2">Order Details</h4>
                    <div *ngFor="let item of active.items" class="flex justify-between items-start text-sm">
                      <div>
                        <span class="font-bold text-white">{{ item.quantity }}x {{ item.itemName }}</span>
                        <p class="text-xs text-neutral-300 mt-0.5">{{ item.size }}{{ item.crust ? ' • ' + item.crust : '' }}</p>
                        <p *ngIf="item.toppings?.length" class="text-[10px] text-neutral-400 mt-0.5">+ {{ item.toppings.join(', ') }}</p>
                      </div>
                      <span class="font-bold text-[#D4AF37]">{{ item.lineTotal | currency }}</span>
                    </div>
                    
                    <div class="border-t border-dashed border-[#D4AF37]/30 pt-3 mt-3 space-y-1.5 text-xs text-neutral-300">
                      <div class="flex justify-between"><span>Subtotal</span><span>{{ active.total * 0.85 | currency }}</span></div>
                      <div class="flex justify-between"><span>Taxes & Fees</span><span>{{ active.total * 0.15 | currency }}</span></div>
                      <div *ngIf="active.deliveryType === 'STORE_DELIVERY'" class="flex justify-between text-[#E53935] font-medium">
                        <span>MiSlice Delivery Promo</span><span>-$0.00</span>
                      </div>
                    </div>
                    <div class="border-t border-[#D4AF37]/20 pt-3 flex justify-between items-center mt-3">
                      <span class="font-black text-white">Total Paid</span>
                      <span class="font-black text-lg text-[#D4AF37]">{{ active.total | currency }}</span>
                    </div>
                  </div>

                </div>

                <!-- Order Actions -->
                <div class="pt-4 border-t border-[#D4AF37]/20 flex flex-wrap gap-3">
                  <button class="px-4 py-2 bg-[#1C0338] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-white font-bold text-xs rounded-xl transition">Print Receipt</button>
                  <button class="px-4 py-2 bg-[#1C0338] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-white font-bold text-xs rounded-xl transition">Contact Support</button>
                  <button class="px-4 py-2 bg-[#1C0338] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-white font-bold text-xs rounded-xl transition">Share Tracker</button>
                </div>
              </div>
            </div>

            <!-- PAST ORDERS LIST -->
            <div>
              <div class="flex items-center justify-between mb-4 mt-8">
                <h2 class="text-xl font-black text-[#D4AF37]">Past Orders</h2>
                <span class="text-xs font-bold text-[#D4AF37] bg-[#1C0338] border border-[#D4AF37]/20 px-2.5 py-1 rounded-full">{{ pastOrders().length }} orders</span>
              </div>
              
              <div *ngIf="pastOrders().length === 0" class="bg-[#1C0338] rounded-2xl border border-[#D4AF37]/20 p-12 text-center shadow-sm">
                <div class="text-6xl mb-4 opacity-50">🍕</div>
                <h3 class="text-lg font-black text-white mb-2">No Past Orders</h3>
                <p class="text-neutral-300 text-sm mb-6">You don't have any completed orders yet. Start comparing to find the best pizza!</p>
                <button routerLink="/builder" class="px-6 py-2.5 bg-[#D4AF37] text-black font-black text-sm rounded-xl hover:brightness-110 transition">
                  Compare Pizzas
                </button>
              </div>

              <div class="space-y-4">
                <div *ngFor="let order of pastOrders()" class="bg-[#1C0338] rounded-[20px] p-5 shadow-sm border border-[#D4AF37]/25 hover:border-[#D4AF37] transition-all group">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div class="flex items-center gap-4">
                      <!-- Restaurant Avatar placeholder -->
                      <div class="w-14 h-14 rounded-2xl bg-[#0A0A0A] border border-[#D4AF37]/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform text-[#D4AF37]">
                        {{ order.restaurantName?.charAt(0) || '🍕' }}
                      </div>
                      <div>
                        <h3 class="font-black text-white text-base">{{ order.restaurantName }}</h3>
                        <p class="text-xs font-medium text-neutral-300 mb-1">
                          {{ order.items[0]?.itemName || 'Custom Pizza' }}
                          <span *ngIf="order.items.length > 1" class="text-[10px] bg-[#0A0A0A] border border-[#D4AF37]/15 px-1.5 py-0.5 rounded text-neutral-200">+{{ order.items.length - 1 }} more</span>
                        </p>
                        <div class="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <span>{{ order.placedAt | date:'MMM d, y' }}</span>
                          <span class="w-1 h-1 rounded-full bg-neutral-600"></span>
                          <span [class]="order.status === 'DELIVERED' ? 'text-[#D4AF37]' : 'text-neutral-400'">{{ order.status }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-col sm:items-end gap-3 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                      <div class="text-right">
                        <span class="font-black text-lg text-[#111827]">{{ order.total | currency }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <button class="px-4 py-1.5 bg-gray-50 hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-lg transition border border-gray-200">
                          Receipt
                        </button>
                        <button routerLink="/builder" class="px-4 py-1.5 bg-[#FF8A00]/10 hover:bg-[#FF8A00]/20 text-[#FF8A00] font-black text-xs rounded-lg transition border border-[#FF8A00]/20 flex items-center gap-1">
                          <span>Reorder</span>
                          <span class="text-[10px]">↻</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Analytics & AI Insights -->
          <div class="space-y-6">
            
            <!-- AI Insights -->
            <div class="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] border-l-4 border-l-[#FF8A00] p-6 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 text-6xl opacity-5">🤖</div>
              <h3 class="text-sm font-black text-[#111827] uppercase tracking-widest flex items-center gap-2 mb-4">
                <span>✨</span> MiSlice AI Insights
              </h3>
              <div class="space-y-4">
                <div class="bg-[#FF8A00]/5 rounded-xl p-3 border border-[#FF8A00]/10">
                  <p class="text-xs text-[#111827] font-medium leading-relaxed">
                    Based on your history, you usually order <span class="font-black">Pepperoni Pizza</span> on <span class="font-black">Friday evenings</span>.
                  </p>
                </div>
                <div class="bg-[#E53935]/5 rounded-xl p-3 border border-[#E53935]/10">
                  <p class="text-xs text-[#111827] font-medium leading-relaxed">
                    You've saved an estimated <span class="font-black text-[#E53935]">$42.50</span> by comparing pizza prices through MiSlice this year!
                  </p>
                </div>
                <div class="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p class="text-xs text-[#111827] font-medium leading-relaxed">
                    <span class="font-black">Shamz Pizza</span> is currently offering 10% off for repeat customers.
                  </p>
                  <button routerLink="/builder" class="mt-2 text-[10px] font-black uppercase text-blue-600 hover:underline">Claim Offer →</button>
                </div>
              </div>
            </div>

            <!-- Analytics Dashboard -->
            <div class="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
              <h3 class="text-sm font-black text-[#111827] uppercase tracking-widest mb-5">Your Pizza Stats</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p class="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Orders (Year)</p>
                  <p class="text-2xl font-black text-[#111827]">{{ orders().length }}</p>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p class="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Fav Store</p>
                  <p class="text-sm font-black text-[#111827] leading-tight truncate">
                    {{ orders().length > 0 ? (orders()[0].restaurantName || 'Shamz Pizza') : '—' }}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p class="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Avg Prep</p>
                  <p class="text-lg font-black text-[#111827]">23 <span class="text-xs text-gray-500 font-bold">min</span></p>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p class="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Total Spent</p>
                  <p class="text-lg font-black text-[#111827]">{{ totalSpent | currency }}</p>
                </div>
              </div>
            </div>

            <!-- Payment Methods Mock -->
            <div class="bg-white rounded-[20px] shadow-sm border border-[#E5E7EB] p-6">
              <h3 class="text-sm font-black text-[#111827] uppercase tracking-widest mb-4">Payment Methods</h3>
              <div class="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-5 bg-[#111827] rounded text-[8px] text-white flex items-center justify-center font-black">VISA</div>
                  <div>
                    <p class="text-xs font-bold text-[#111827]">•••• 2458</p>
                    <p class="text-[10px] text-[#6B7280]">Expires 12/28</p>
                  </div>
                </div>
                <span class="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded">Default</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  orders = signal<OrderDto[]>([]);
  loading = signal(true);
  
  filters = ['All', 'Active', 'Completed', 'Cancelled', 'Delivery', 'Pickup'];
  activeFilter = signal('All');
  searchQuery = '';

  activeOrder = computed(() => {
    // Find the most recent active order
    return this.orders().find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  });

  pastOrders = computed(() => {
    let list = this.orders().filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');
    
    // Apply filters
    if (this.activeFilter() === 'Active') {
      list = []; // Active shown above
    } else if (this.activeFilter() === 'Completed') {
      list = list.filter(o => o.status === 'DELIVERED');
    } else if (this.activeFilter() === 'Cancelled') {
      list = list.filter(o => o.status === 'CANCELLED');
    } else if (this.activeFilter() === 'Delivery') {
      list = list.filter(o => o.deliveryType === 'STORE_DELIVERY');
    } else if (this.activeFilter() === 'Pickup') {
      list = list.filter(o => o.deliveryType === 'PICKUP');
    }

    // Apply search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) || 
        (o.restaurantName || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  get totalSpent(): number {
    return this.orders().reduce((sum, o) => sum + (o.total || 0), 0);
  }

  ngOnInit() { 
    this.load(); 
  }

  load() {
    this.loading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res.content ?? [];
        // Sort descending by placedAt
        list.sort((a: any, b: any) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        this.orders.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  trackerProgress(status: string): number {
    const map: Record<string, number> = {
      'PENDING': 0,
      'CONFIRMED': 25,
      'PREPARING': 50,
      'OUT_FOR_DELIVERY': 75,
      'DELIVERED': 100
    };
    return map[status] || 0;
  }
}
