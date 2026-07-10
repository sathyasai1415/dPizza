import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { MenuService } from '../../core/services/menu.service';
import { Store, OrderDto, MenuItem, Deal } from '../../shared/models';

interface StaffMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Chef' | 'Driver' | 'Cashier';
  email: string;
  status: 'Active' | 'Pending';
  joinedAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockQty: number;
  unit: string;
  minAlert: number;
  available: boolean;
}

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  bankAccount: string;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-7xl mx-auto py-6 px-4 space-y-6">

      <!-- MAIN HEADER CONSOLE -->
      <div class="glass rounded-[2rem] p-6 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900/90 to-red-950/20 shadow-xl">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="text-3xl">{{ selectedShop()?.emoji || '🏪' }}</span>
            <div>
              <h2 class="text-2xl font-black text-white tracking-tight">{{ selectedShop()?.name || 'Merchant Control' }}</h2>
              <p class="text-xs text-white/50 font-medium">Store Console • ID: {{ selectedShop()?.id || 'Select a restaurant' }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <!-- Accepting orders toggle -->
          <div class="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-white/5 bg-white/5 shrink-0 ml-auto md:ml-0">
            <span class="text-xs font-bold" [class.text-emerald-400]="online()" [class.text-white/40]="!online()">
              {{ online() ? '🟢 Accepting Orders' : '🔴 Closed / Offline' }}
            </span>
            <button (click)="toggleOnline()" [disabled]="!selectedShop()"
              [class]="'w-9 h-5 rounded-full relative transition ' + (online() ? 'bg-emerald-500' : 'bg-white/15')">
              <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md" [style.left]="online() ? '18px' : '2px'"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- SUCCESS / NOTIFICATION BANNERS -->
      @if (successMsg()) {
        <div class="glass border border-emerald-500/35 bg-emerald-500/10 rounded-2xl p-4 text-center text-emerald-400 font-bold text-sm animate-fadeIn">
          ✅ {{ successMsg() }}
        </div>
      }
      @if (ocrError()) {
        <div class="glass border border-red-500/35 bg-red-500/10 rounded-2xl p-4 text-center text-red-400 font-bold text-sm animate-fadeIn">
          ⚠️ {{ ocrError() }}
        </div>
      }

      <!-- RESTAURANT SELECTOR -->
      <div *ngIf="shops().length > 1" class="glass rounded-3xl p-5 border border-white/5 space-y-3 bg-black/25">
        <label class="block text-[10px] font-black text-white/40 uppercase tracking-widest">Select Managed Store</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button *ngFor="let shop of shops()" (click)="selectShop(shop)"
            [class]="selectedShop()?.id === shop.id 
              ? 'glass border border-red-500/50 bg-red-500/10 p-3 rounded-2xl text-left' 
              : 'glass p-3 rounded-2xl text-left hover:border-white/20 transition bg-white/5'">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ shop.emoji }}</span>
              <h3 class="font-bold text-white text-xs truncate">{{ shop.name }}</h3>
            </div>
            <p class="text-[9px] text-white/40 mt-1 truncate">{{ shop.city }}, MI</p>
          </button>
        </div>
      </div>

      <div *ngIf="!selectedShop() && shopsLoaded()" class="glass rounded-3xl p-12 text-center border border-white/5">
        <p class="text-4xl mb-3">🏪</p>
        <p class="font-black text-white text-lg">No Restaurants Registered</p>
        <p class="text-xs text-white/50 mt-1 max-w-sm mx-auto">Only the account registered as a RESTAURANT_OWNER can access this console.</p>
      </div>

      <!-- MAIN TABS GRID -->
      <div *ngIf="selectedShop()" class="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        
        <!-- Sidebar Navigation -->
        <div class="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none shrink-0">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
              [class]="'glare-hover text-left px-4 py-3 rounded-2xl text-xs font-black transition whitespace-nowrap min-w-[140px] lg:min-w-0 ' +
                (activeTab() === tab.id
                  ? 'bg-gradient-to-r from-red-700/80 to-orange-600/50 text-white border border-red-500/30 shadow-md shadow-red-600/10'
                  : 'text-white/60 hover:text-white')">
              <span class="relative z-10 flex items-center gap-3">
                <span class="text-sm">{{ tab.icon }}</span>
                {{ tab.name }}
              </span>
            </button>
          }
        </div>

        <!-- Selected Tab View Content -->
        <div class="glass rounded-[2rem] p-6 min-h-[500px] border border-white/10 bg-black/35 shadow-2xl space-y-6">

          <!-- TAB 1: DASHBOARD (Overview KPIs, Quick Actions, AI Insights) -->
          <div *ngIf="activeTab() === 'dashboard'" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">📊 Operations Dashboard</h3>
                <p class="text-xs text-white/50 mt-0.5">Real-time overview of metrics, instant campaigns, and AI guidance.</p>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">LIVE DATA</span>
            </div>

            <!-- QUICK ACTIONS PANEL -->
            <div class="glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-neutral-900 to-red-950/10 space-y-3 shadow-md">
              <h4 class="text-xs font-black uppercase text-white/55 tracking-wider flex items-center gap-1.5">
                ⚡ Quick Campaigns Launcher
              </h4>
              <p class="text-[10px] text-white/40">Instantly publish pre-configured promotions to target buyers and rank higher on comparison quotes.</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button (click)="applyQuickAction('10%')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-500/30 text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🏷️</span>
                  <span class="text-xs font-black text-white">10% Off Deal</span>
                  <span class="text-[9px] text-white/40">Flash Discount</span>
                </button>
                <button (click)="applyQuickAction('20%')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-500/30 text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🔥</span>
                  <span class="text-xs font-black text-white">20% Off Deal</span>
                  <span class="text-[9px] text-white/40">Super Saver</span>
                </button>
                <button (click)="applyQuickAction('BOGO')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-500/30 text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🍕</span>
                  <span class="text-xs font-black text-white">BOGO Deal</span>
                  <span class="text-[9px] text-white/40">Buy 1 Get 1</span>
                </button>
                <button (click)="applyQuickAction('FREE_DELIVERY')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-500/30 text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🚗</span>
                  <span class="text-xs font-black text-white">Free Delivery</span>
                  <span class="text-[9px] text-white/40">No Delivery Fee</span>
                </button>
              </div>
            </div>

            <!-- AI INSIGHTS & recommendations PANEL -->
            <div class="glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-neutral-900 via-red-950/15 to-blue-950/10 space-y-3.5 shadow-lg relative overflow-hidden">
              <!-- Ambient background decoration -->
              <div class="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 class="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-2">
                  🧠 MiSlice AI Pricing &amp; Operations Copilot
                </h4>
                <span class="text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md border border-red-500/25">ADVANCED RECOMMENDATION</span>
              </div>
              
              <div class="grid gap-3">
                <div class="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                  <span class="text-lg shrink-0 mt-0.5">📊</span>
                  <div class="text-xs">
                    <p class="font-bold text-white">Local Competitor Alert</p>
                    <p class="text-white/50 text-[11px] mt-0.5">Pizzerias in Midtown Detroit have lowered their average delivery fees to $1.99. Yours is currently $2.99, reducing quote conversions by 8.4%. Consider launching our <b>Free Delivery</b> special to reclaim top comparisons.</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                  <span class="text-lg shrink-0 mt-0.5">💡</span>
                  <div class="text-xs">
                    <p class="font-bold text-white">Price Optimization Opportunity</p>
                    <p class="text-white/50 text-[11px] mt-0.5">Your "Detroit Deep Dish Pepperoni" has been compared 1,802 times this week with zero price bounce metrics. Standard margin parameters suggest raising its base price by $0.75 which would yield <b>+$135.15</b> weekly revenue with negligible volume loss.</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                  <span class="text-lg shrink-0 mt-0.5">⏰</span>
                  <div class="text-xs">
                    <p class="font-bold text-white">Demand Forecast &amp; Hours Schedule</p>
                    <p class="text-white/50 text-[11px] mt-0.5">Platform volume forecasts indicate a 22% peak order volume spike this Friday between 6:00 PM and 8:30 PM. Verify that your Chef and Driver teams are fully staffed and set to active status in the team directory.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bento Stats Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="glass rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-white/5 to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">💰</span>
                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">+12.3%</span>
                </div>
                <p class="text-2xl font-black text-white mt-2">{{ netEarnings() | currency }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Net Revenue (80%)</p>
              </div>

              <div class="glass rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-white/5 to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">📦</span>
                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">+5</span>
                </div>
                <p class="text-2xl font-black text-white mt-2">{{ orders().length }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Total Orders</p>
              </div>

              <div class="glass rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-white/5 to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">🔥</span>
                  <span class="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md">Prep</span>
                </div>
                <p class="text-2xl font-black text-white mt-2">{{ activeOrders() }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Active Kitchen</p>
              </div>

              <div class="glass rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-white/5 to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">⭐</span>
                  <span class="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">★★★★★</span>
                </div>
                <p class="text-2xl font-black text-white mt-2">{{ selectedShop()?.ratingAvg || 4.8 }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Customer Rating</p>
              </div>
            </div>

            <!-- Double Column Layout: SVG Chart + MiSlice Insights -->
            <div class="grid md:grid-cols-2 gap-6">
              
              <!-- Responsive Weekly Sales SVG Graph -->
              <div class="glass rounded-3xl p-5 border border-white/5 bg-black/20 space-y-4">
                <h4 class="text-xs font-black text-white/60 uppercase tracking-widest">Weekly Sales &amp; Traffic</h4>
                <div class="h-44 w-full flex items-end">
                  <svg viewBox="0 0 400 150" class="w-full h-full text-red-500 overflow-visible">
                    <!-- Grid Lines -->
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                    <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                    <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                    
                    <!-- Line Path -->
                    <path d="M 20 120 L 80 90 L 140 110 L 200 60 L 260 80 L 320 40 L 380 30" 
                      fill="none" stroke="url(#gradient)" stroke-width="4" stroke-linecap="round"/>
                    
                    <!-- Area Fill -->
                    <path d="M 20 120 L 80 90 L 140 110 L 200 60 L 260 80 L 320 40 L 380 30 L 380 150 L 20 150 Z" 
                      fill="url(#areaGradient)" opacity="0.15"/>

                    <!-- Data dots -->
                    <circle cx="200" cy="60" r="5" fill="#f97316"/>
                    <circle cx="380" cy="30" r="5" fill="#dc2626"/>

                    <!-- X Axis Labels -->
                    <text x="20" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Mon</text>
                    <text x="140" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Wed</text>
                    <text x="260" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Fri</text>
                    <text x="380" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Today</text>

                    <!-- Gradients -->
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#f97316"/>
                        <stop offset="100%" stop-color="#dc2626"/>
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#dc2626"/>
                        <stop offset="100%" stop-color="transparent"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div class="flex justify-between items-center text-[10px] text-white/40">
                  <p>Weekly peak ordering: <b>Fri 6:00 PM - 8:30 PM</b></p>
                  <p>AOV: <b>$24.50</b></p>
                </div>
              </div>

              <!-- MiSlice Exclusive Insights & Analytics -->
              <div class="glass rounded-3xl p-5 border border-white/5 bg-black/20 space-y-4">
                <h4 class="text-xs font-black text-white/60 uppercase tracking-widest">MiSlice Competitive Insights</h4>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <p class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Price Competitiveness</p>
                    <p class="text-xl font-black text-emerald-400 mt-1">94%</p>
                    <p class="text-[9px] text-white/40 mt-0.5">Competitive in local area</p>
                  </div>
                  <div class="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <p class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Search Ranking</p>
                    <p class="text-xl font-black text-yellow-400 mt-1">#3</p>
                    <p class="text-[9px] text-white/40 mt-0.5">In city search index</p>
                  </div>
                  <div class="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <p class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Clicks</p>
                    <p class="text-xl font-black text-white mt-1">1,402</p>
                    <p class="text-[9px] text-white/40 mt-0.5">Customer views this week</p>
                  </div>
                  <div class="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <p class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Leaderboard Rank</p>
                    <p class="text-xl font-black text-red-400 mt-1">#2</p>
                    <p class="text-[9px] text-white/40 mt-0.5">Most compared pepperoni</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- TAB 2: ACTIVE KITCHEN ORDERS -->
          <div *ngIf="activeTab() === 'orders'" class="space-y-4 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">📦 Active Kitchen Orders</h3>
                <p class="text-xs text-white/50 mt-0.5">Manage live order requests, accept/reject, and transition order states.</p>
              </div>
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
                    <span class="text-[9px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full capitalize">
                      {{ order.deliveryType?.replace('_', ' ') }}
                    </span>
                  </div>
                  <p class="text-[10px] text-white/40">{{ order.placedAt | date:'medium' }}</p>

                  <div class="space-y-1 pt-1">
                    <div *ngFor="let item of order.items" class="text-xs text-white/80">
                      🍕 <b class="text-white">{{ item.quantity }}x</b> {{ item.itemName }} ({{ item.size }})
                      <div *ngIf="item.toppings?.length" class="text-[10px] text-white/40 ml-4">
                        Toppings: {{ item.toppings.join(', ') }}
                      </div>
                    </div>
                  </div>
                  <p class="text-[10px] text-white/60 bg-white/5 p-2 rounded-xl border border-white/5 inline-block" *ngIf="order.deliveryAddress">
                    📍 Delivery Address: {{ order.deliveryAddress }}
                  </p>
                </div>

                <div class="flex flex-col justify-between items-end gap-3 min-w-[150px]">
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

          <!-- TAB 3: MENU MANAGER (Manual & OCR Cloud Vision Importer) -->
          <div *ngIf="activeTab() === 'menu'" class="space-y-4 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">🍕 Menu Catalog &amp; Price Manager</h3>
              <p class="text-xs text-white/50 mt-0.5">Control pricing types, available custom options, and add/edit menu pizzas.</p>
            </div>

            <!-- Add new item -->
            <div class="glass rounded-2xl p-5 border border-white/5 space-y-3 bg-white/5">
              <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Add Pizza or Side Item</h4>
              <div class="grid sm:grid-cols-4 gap-2 text-xs">
                <input type="text" [(ngModel)]="newItem.name" placeholder="Item name (e.g. Buffalo Chicken Pizza)"
                  class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 sm:col-span-2" />
                <input type="number" [(ngModel)]="newItem.basePrice" placeholder="Base Price $" min="0" step="0.01"
                  class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                <select [(ngModel)]="newItem.itemType"
                  class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500">
                  <option class="bg-neutral-900" *ngFor="let t of itemTypes" [value]="t">{{ t }}</option>
                </select>
              </div>
              <div class="flex justify-end pt-1">
                <button (click)="addItem()" [disabled]="!newItem.name.trim() || savingItem()"
                  class="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-bold rounded-xl transition shadow-lg">
                  + Add Item
                </button>
              </div>
            </div>

            <!-- Google Cloud Vision OCR Menu Import -->
            <div class="glass rounded-2xl p-5 border border-white/5 space-y-4 bg-gradient-to-br from-neutral-900 to-red-955/20">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-2">
                <div>
                  <h4 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    ✨ AI Menu Import (Cloud Vision OCR)
                  </h4>
                  <p class="text-[10px] text-white/50">Upload a photo of your paper menu or sign. Our AI extracts items and pricing instantly.</p>
                </div>
                <span class="text-[8px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">POWERED BY GOOGLE CLOUD VISION</span>
              </div>

              <!-- Upload Drag & Drop area -->
              <div class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-red-500/50 transition">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <span class="text-3xl mb-2">📸</span>
                    <p class="text-xs font-bold text-white">Select or Drag Menu Photo</p>
                    <p class="text-[10px] text-white/40 mt-0.5">Supports PNG, JPG, JPEG, WebP</p>
                  </div>
                  <input type="file" class="hidden" (change)="onMenuFileSelected($event)" accept="image/*" />
                </label>
              </div>

              <!-- Loading Indicator -->
              <div *ngIf="processingOcr()" class="flex flex-col items-center justify-center py-4 space-y-2">
                <div class="animate-spin rounded-full h-7 w-7 border-t-2 border-red-500"></div>
                <p class="text-[10px] text-white/50 font-bold animate-pulse">Running Cloud Vision OCR text extraction...</p>
              </div>

              <!-- OCR Suggestions Review Pane -->
              <div *ngIf="ocrSuggestions().length > 0" class="space-y-3 pt-2">
                <div class="flex items-center justify-between">
                  <h5 class="text-xs font-black text-white/80">📋 Parsed Suggestions (Review &amp; Edit)</h5>
                  <button (click)="ocrSuggestions.set([])" class="text-[10px] text-white/40 hover:text-white underline">Clear</button>
                </div>
                <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                  @for (s of ocrSuggestions(); track $index) {
                    <div class="glass-soft rounded-xl p-3 border border-white/5 flex items-center gap-3 bg-black/20 text-xs">
                      <input type="checkbox" [(ngModel)]="s.selected" class="w-4 h-4 accent-red-600 rounded cursor-pointer" />
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input type="text" [(ngModel)]="s.name" placeholder="Item Name"
                          class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-red-500" />
                        <div class="flex items-center gap-1">
                          <span class="text-white/45">$</span>
                          <input type="number" [(ngModel)]="s.basePrice" min="0" step="0.01"
                            class="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-red-500" />
                        </div>
                        <select [(ngModel)]="s.itemType"
                          class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-red-500">
                          <option class="bg-neutral-900" *ngFor="let t of itemTypes" [value]="t">{{ t }}</option>
                        </select>
                      </div>
                    </div>
                  }
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button (click)="importSelectedOcrItems()" [disabled]="importingOcr()"
                    class="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-black text-xs rounded-xl transition shadow-lg shadow-red-500/10">
                    {{ importingOcr() ? 'Importing...' : 'Confirm & Import Selected Items' }}
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="loadingMenu()" class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
            </div>

            <div *ngIf="!loadingMenu() && menuItems().length === 0" class="text-center py-10 text-white/40 text-xs">
              No menu items yet. Add your first pizza above.
            </div>

            <div class="space-y-2 pt-1">
              <div *ngFor="let item of menuItems()" class="glass rounded-xl p-4 border border-white/5 flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <div class="min-w-0">
                  <h4 class="text-sm font-bold text-white truncate">{{ item.name }}</h4>
                  <span class="text-[9px] bg-white/10 text-white/50 px-2 py-0.5 rounded uppercase font-black tracking-wider">{{ item.itemType }}</span>
                </div>

                <div class="flex items-center gap-3">
                  <!-- price input -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-white/40">$</span>
                    <input type="number" [(ngModel)]="item.basePrice" min="0" step="0.01"
                      class="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center text-white outline-none focus:border-red-500" />
                    <button (click)="saveItem(item)" [disabled]="savingItem()"
                      class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition">Save</button>
                  </div>
                  <!-- toggle stock -->
                  <button (click)="toggleAvailability(item)"
                    [class]="'px-3 py-1 rounded-lg text-[10px] font-bold transition ' + (item.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')">
                    {{ item.available ? 'In Stock' : 'Out of Stock' }}
                  </button>
                  <!-- delete -->
                  <button (click)="deleteItem(item)" title="Delete item"
                    class="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: DEALS & PROMOTIONS -->
          <div *ngIf="activeTab() === 'deals'" class="space-y-4 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">🏷️ Store Deals &amp; Promotions</h3>
              <p class="text-xs text-white/50 mt-0.5">Publish special discount rates and campaign specials visible on the comparison board.</p>
            </div>

            <div class="grid sm:grid-cols-2 gap-6">
              <!-- Add Deal Form -->
              <div class="glass rounded-2xl p-5 border border-white/5 space-y-3 bg-white/5 flex flex-col justify-between">
                <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Create Custom Promo / BOGO</h4>
                <div class="space-y-3 text-xs">
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Deal Title</label>
                    <input type="text" [(ngModel)]="newDeal.title" placeholder="e.g. Double Play: 2 Mediums for $19.99"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Description</label>
                    <input type="text" [(ngModel)]="newDeal.description" placeholder="Include toppings limit or size details"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-white/40 mb-1">Original Price ($)</label>
                      <input type="number" [(ngModel)]="newDeal.originalPrice" placeholder="24.99" min="0" step="0.01"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/40 mb-1">Sale / Deal Price ($)</label>
                      <input type="number" [(ngModel)]="newDeal.discountedPrice" placeholder="19.99" min="0" step="0.01"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                    </div>
                  </div>
                  <button (click)="addDeal()" [disabled]="!newDeal.title.trim() || savingDeal()"
                    class="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-black rounded-xl transition shadow-lg mt-2">
                    Publish Campaign 🏷️
                  </button>
                </div>
              </div>

              <!-- Active Deals List -->
              <div class="space-y-3">
                <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Active Campaigns &amp; Conversion</h4>
                <div *ngIf="loadingDeals()" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-red-500"></div>
                </div>
                <div *ngIf="!loadingDeals() && deals().length === 0" class="text-center py-8 text-white/40 text-xs">
                  No deals yet. Create one to attract buyers.
                </div>
                <div *ngFor="let deal of deals()" class="glass rounded-xl p-4 border border-white/5 flex justify-between items-center text-xs bg-white/5">
                  <div class="min-w-0">
                    <span class="font-black text-white text-sm">{{ deal.title }}</span>
                    <p class="text-xs text-white/50 mt-0.5 truncate">{{ deal.description }}</p>
                    <p class="text-[10px] text-white/40 mt-1">
                      <span *ngIf="deal.originalPrice" class="line-through text-white/30">{{ deal.originalPrice | currency }}</span>
                      <span *ngIf="deal.discountedPrice" class="text-emerald-400 font-bold ml-1">{{ deal.discountedPrice | currency }}</span>
                    </p>
                  </div>
                  <div class="flex flex-col items-end gap-2 shrink-0">
                    <button (click)="toggleDeal(deal)"
                      [class]="'px-2.5 py-1 rounded-lg text-[10px] font-black transition ' + (deal.active ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20')">
                      {{ deal.active ? 'Active' : 'Disabled' }}
                    </button>
                    <span class="text-[9px] text-white/40">CTR: <b>8.4%</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: REVIEWS & RATINGS -->
          <div *ngIf="activeTab() === 'reviews'" class="space-y-6 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">⭐ Customer Reviews &amp; Ratings Breakdown</h3>
              <p class="text-xs text-white/50 mt-0.5">Read reviews, filter feedback, and monitor overall store rating parameters.</p>
            </div>

            <!-- Sentiment & Breakdown Cards -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="glass p-5 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">Overall Sentiment Meter</p>
                <div class="flex items-center gap-3 mt-2">
                  <div class="text-3xl">😊</div>
                  <div>
                    <p class="text-2xl font-black text-emerald-400">92% Positive</p>
                    <p class="text-[9px] text-white/40 mt-0.5">Based on sentiment analysis of 24 reviews</p>
                  </div>
                </div>
              </div>
              <div class="glass p-5 rounded-2xl border border-white/5 bg-white/5 space-y-1.5 text-xs">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider mb-1">Stars Distribution</p>
                <div class="flex items-center gap-2">
                  <span class="w-10 text-[10px] text-white/50 text-right">5 ★</span>
                  <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400" style="width: 80%"></div>
                  </div>
                  <span class="w-8 text-[10px] text-white/60 text-left">80%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-10 text-[10px] text-white/50 text-right">4 ★</span>
                  <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400" style="width: 15%"></div>
                  </div>
                  <span class="w-8 text-[10px] text-white/60 text-left">15%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-10 text-[10px] text-white/50 text-right">3 ★</span>
                  <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400" style="width: 5%"></div>
                  </div>
                  <span class="w-8 text-[10px] text-white/60 text-left">5%</span>
                </div>
              </div>
            </div>

            <!-- Review feeds -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Recent Feedback Feed</h4>
              <div *ngFor="let rev of mockReviews" class="glass rounded-2xl p-4 border border-white/5 bg-white/5 space-y-2">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-xs font-black text-white">{{ rev.author }}</span>
                    <p class="text-[9px] text-white/40">{{ rev.date | date }}</p>
                  </div>
                  <span class="text-xs text-yellow-400 font-bold">★ {{ rev.rating }}.0</span>
                </div>
                <p class="text-xs text-white/70 leading-relaxed font-medium">"{{ rev.comment }}"</p>
                
                <!-- Response input -->
                <div class="pt-2 border-t border-white/5 flex gap-2">
                  <input type="text" placeholder="Write official merchant response..." 
                    class="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white outline-none focus:border-red-500" />
                  <button class="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg text-[9px] font-black text-white transition">Send</button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 6: STORE HOURS -->
          <div *ngIf="activeTab() === 'hours'" class="space-y-4 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">⏰ Store Hours &amp; Operating Settings</h3>
                <p class="text-xs text-white/50 mt-0.5">Control operating hours schedule, delivery parameters, and contact info.</p>
              </div>
              <span *ngIf="settingsSaved()" class="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 animate-fadeIn">✓ Saved successfully</span>
            </div>

            <div class="grid sm:grid-cols-2 gap-6 text-xs">
              <div class="space-y-3">
                <p class="text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 pb-1">Branding Details</p>
                <div>
                  <label class="block text-[10px] text-white/40 mb-1">Restaurant/Brand Name</label>
                  <input type="text" [(ngModel)]="selectedShop()!.name"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                </div>
                <div>
                  <label class="block text-[10px] text-white/40 mb-1">Tagline</label>
                  <input type="text" [(ngModel)]="selectedShop()!.tagline"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Phone Number</label>
                    <input type="text" [(ngModel)]="selectedShop()!.phone"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Category</label>
                    <input type="text" [(ngModel)]="selectedShop()!.category"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                </div>

                <p class="text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 pb-1 pt-2">Pricing Parameters</p>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Min Order ($)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.minimumOrder" min="0" step="0.01"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Delivery Fee ($)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.deliveryFee" min="0" step="0.01"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1">Prep Time (min)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.averageEtaMinutes" min="0"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                </div>

                <button (click)="saveSettings()" [disabled]="savingSettings()"
                  class="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-black rounded-xl transition shadow-lg mt-3">
                  {{ savingSettings() ? 'Saving Hours & Settings...' : 'Save Operations Settings' }}
                </button>
              </div>

              <!-- Operating hours & info -->
              <div class="space-y-4">
                <div class="glass-soft rounded-2xl p-4 border border-white/5 space-y-3 bg-white/5">
                  <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Business Address Info</h4>
                  <div class="space-y-1 text-white/70">
                    <p>📍 Address: <b>{{ selectedShop()?.addressLine }}, {{ selectedShop()?.city }}, {{ selectedShop()?.state }}</b></p>
                    <p>🌐 Website: <a [href]="selectedShop()?.website" target="_blank" class="text-red-400 hover:underline">{{ selectedShop()?.website || 'N/A' }}</a></p>
                  </div>
                </div>

                <!-- Operating hours widget -->
                <div class="glass-soft rounded-2xl p-4 border border-white/5 space-y-2 bg-white/5">
                  <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Weekly Operating Hours</h4>
                  <div class="space-y-1.5 text-white/60">
                    <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span>Monday - Thursday</span>
                      <b class="text-white">10:00 AM - 10:00 PM</b>
                    </div>
                    <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span>Friday - Saturday</span>
                      <b class="text-white">10:00 AM - 11:30 PM</b>
                    </div>
                    <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span>Sunday</span>
                      <b class="text-white">11:00 AM - 9:00 PM</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 7: INSIGHTS & SALES -->
          <div *ngIf="activeTab() === 'insights'" class="space-y-6 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">📈 Sales Analytics &amp; Conversion</h3>
              <p class="text-xs text-white/50 mt-0.5">Detailed metrics regarding average order value, conversion rates, and item performance.</p>
            </div>

            <!-- Stats grid -->
            <div class="grid md:grid-cols-3 gap-4">
              <div class="glass p-4 rounded-2xl border border-white/5 text-center bg-white/5">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">AOV (Average Order Value)</p>
                <p class="text-3xl font-black text-white mt-1">$28.15</p>
                <p class="text-[9px] text-emerald-400 mt-1">▲ 5.4% from last month</p>
              </div>

              <div class="glass p-4 rounded-2xl border border-white/5 text-center bg-white/5">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">Quote Conversion Rate</p>
                <p class="text-3xl font-black text-white mt-1">4.82%</p>
                <p class="text-[9px] text-emerald-400 mt-1">▲ 0.8% platform average</p>
              </div>

              <div class="glass p-4 rounded-2xl border border-white/5 text-center bg-white/5">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">Customer Lifetime Value (CLV)</p>
                <p class="text-3xl font-black text-white mt-1">$112.50</p>
                <p class="text-[9px] text-white/35 mt-1">Target benchmark: $120</p>
              </div>
            </div>

            <!-- Best vs Worst Selling Pizzas Table -->
            <div class="glass rounded-3xl p-5 border border-white/5 bg-black/25 space-y-3">
              <h4 class="text-xs font-black uppercase text-white/50 tracking-wider">Item Popularity Leaderboard</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs border-b border-white/5 pb-2 text-white/40 font-bold">
                  <span>Pizza Name</span>
                  <div class="flex gap-12">
                    <span>Views</span>
                    <span>Comparisons</span>
                    <span>Conversion</span>
                  </div>
                </div>
                <div class="flex justify-between items-center text-xs py-1">
                  <span class="text-white font-bold">Detroit Deep Dish Pepperoni</span>
                  <div class="flex gap-14 text-white/70">
                    <span>4,210</span>
                    <span>1,802</span>
                    <span class="text-emerald-400 font-bold">6.2%</span>
                  </div>
                </div>
                <div class="flex justify-between items-center text-xs py-1">
                  <span class="text-white font-bold">Ultimate Meat Lovers Classic</span>
                  <div class="flex gap-14 text-white/70">
                    <span>3,105</span>
                    <span>1,204</span>
                    <span class="text-emerald-400 font-bold">5.8%</span>
                  </div>
                </div>
                <div class="flex justify-between items-center text-xs py-1">
                  <span class="text-white font-bold">Garden Veggie Square</span>
                  <div class="flex gap-14 text-white/70">
                    <span>1,420</span>
                    <span>680</span>
                    <span class="text-yellow-400 font-bold">2.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 8: FINANCIALS / BILLING (Payout Request & Logs) -->
          <div *ngIf="activeTab() === 'finance'" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">💳 Financials &amp; Billing</h3>
                <p class="text-xs text-white/50 mt-0.5">Request payouts, review payout history logs, and verify connected bank billing info.</p>
              </div>
              <button (click)="requestPayout()" [disabled]="netEarnings() <= 0"
                class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/10">
                💰 Request Instant Payout
              </button>
            </div>

            <!-- Financial metrics overview -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="glass p-5 rounded-2xl border border-white/5 bg-white/5">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">Connected Bank Destination</p>
                <p class="text-base font-black text-white mt-1">Chase Bank Business Account</p>
                <p class="text-xs text-white/40 mt-0.5">Routing: *******9821 • Status: 🟢 ACTIVE</p>
              </div>
              <div class="glass p-5 rounded-2xl border border-white/5 bg-white/5">
                <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">Pending Payout Balance</p>
                <p class="text-2xl font-black text-white mt-0.5">{{ netEarnings() | currency }}</p>
                <p class="text-[9px] text-white/40 mt-0.5">Payout threshold: $50.00 global limit</p>
              </div>
            </div>

            <!-- Payout Logs Table -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Payout History Log</h4>
              <div class="glass-soft rounded-2xl border border-white/5 overflow-hidden">
                <table class="w-full text-xs text-left text-white/70">
                  <thead class="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
                    <tr>
                      <th class="px-4 py-3">Payout ID</th>
                      <th class="px-4 py-3">Transfer Date</th>
                      <th class="px-4 py-3">Routing Destination</th>
                      <th class="px-4 py-3">Amount</th>
                      <th class="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 bg-black/10">
                    <tr *ngFor="let p of payoutHistory">
                      <td class="px-4 py-3 font-mono text-[10px]">{{ p.id }}</td>
                      <td class="px-4 py-3">{{ p.date }}</td>
                      <td class="px-4 py-3">{{ p.bankAccount }}</td>
                      <td class="px-4 py-3 text-white font-bold">{{ p.amount | currency }}</td>
                      <td class="px-4 py-3 text-emerald-400 font-bold">✓ {{ p.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 9: TEAM MEMBERS -->
          <div *ngIf="activeTab() === 'staff'" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">👥 Staff &amp; Team Members</h3>
                <p class="text-xs text-white/50 mt-0.5">Add managers, chefs, and employee accounts to restrict backend console permissions.</p>
              </div>
              <button (click)="showInviteStaff.set(true)" 
                class="px-3 py-1.5 rounded-lg text-xs font-black text-white bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-500/10">
                + Invite Staff
              </button>
            </div>

            <!-- Invite Staff Modal -->
            <div *ngIf="showInviteStaff()" class="glass rounded-2xl p-4 border border-white/10 bg-white/5 space-y-3 text-xs">
              <h4 class="font-bold text-white uppercase tracking-wider">Send Team Invite</h4>
              <div class="grid sm:grid-cols-3 gap-2">
                <input type="text" [(ngModel)]="newStaff.name" placeholder="Full Name" 
                  class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                <input type="email" [(ngModel)]="newStaff.email" placeholder="Email Address" 
                  class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                <select [(ngModel)]="newStaff.role" 
                  class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500">
                  <option value="Manager">Manager</option>
                  <option value="Chef">Chef</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              <div class="flex justify-end gap-2">
                <button (click)="showInviteStaff.set(false)" class="px-3 py-1.5 rounded-lg font-bold bg-white/10 hover:bg-white/15 text-white">Cancel</button>
                <button (click)="inviteStaff()" class="px-3 py-1.5 rounded-lg font-black bg-red-600 hover:bg-red-500 text-white shadow-md">Invite</button>
              </div>
            </div>

            <!-- Staff table -->
            <div class="glass-soft rounded-2xl border border-white/5 overflow-hidden">
              <table class="w-full text-xs text-left text-white/70">
                <thead class="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
                  <tr>
                    <th class="px-4 py-3">Name</th>
                    <th class="px-4 py-3">Role</th>
                    <th class="px-4 py-3">Email</th>
                    <th class="px-4 py-3">Joined Date</th>
                    <th class="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-black/10">
                  <tr *ngFor="let s of staffList">
                    <td class="px-4 py-3 text-white font-bold">{{ s.name }}</td>
                    <td class="px-4 py-3">{{ s.role }}</td>
                    <td class="px-4 py-3">{{ s.email }}</td>
                    <td class="px-4 py-3">{{ s.joinedAt }}</td>
                    <td class="px-4 py-3">
                      <span [class]="s.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'" 
                        class="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border border-current/10">
                        {{ s.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .glare-hover {
      --gh-angle: -30deg;
      --gh-rgba: rgba(232, 5, 5, 0.4);
      --gh-duration: 900ms;
      --gh-size: 200%;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.02);
    }
    .glare-hover::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        var(--gh-angle),
        rgba(0, 0, 0, 0) 50%,
        var(--gh-rgba) 65%,
        rgba(0, 0, 0, 0) 80%
      );
      transition: background-position var(--gh-duration) cubic-bezier(0.16, 1, 0.3, 1);
      background-size: var(--gh-size) var(--gh-size);
      background-repeat: no-repeat;
      background-position: -150% -150%;
      pointer-events: none;
      z-index: 5;
    }
    .glare-hover:hover::before {
      background-position: 150% 150%;
    }
  `]
})
export class OwnerDashboardComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);
  private readonly menuService = inject(MenuService);

  shops = signal<Store[]>([]);
  shopsLoaded = signal(false);
  selectedShop = signal<Store | null>(null);
  orders = signal<OrderDto[]>([]);
  menuItems = signal<MenuItem[]>([]);
  deals = signal<Deal[]>([]);
  
  activeTab = signal('dashboard');
  orderSubTab = signal('active');
  
  loadingOrders = signal(false);
  loadingMenu = signal(false);
  loadingDeals = signal(false);
  savingItem = signal(false);
  savingDeal = signal(false);
  savingSettings = signal(false);
  settingsSaved = signal(false);
  online = signal(true);
  
  // OCR processing signals
  ocrSuggestions = signal<any[]>([]);
  processingOcr = signal(false);
  importingOcr = signal(false);
  ocrError = signal('');
  successMsg = signal('');

  // Staff and Roles properties
  showInviteStaff = signal(false);
  newStaff = { name: '', email: '', role: 'Manager' as StaffMember['role'] };
  staffList: StaffMember[] = [
    { id: '1', name: 'Demo Store Owner', role: 'Owner', email: 'owner@shamzpizza.com', status: 'Active', joinedAt: '2026-01-10' },
    { id: '2', name: 'Chef Mario', role: 'Chef', email: 'mario@shamzpizza.com', status: 'Active', joinedAt: '2026-03-12' },
    { id: '3', name: 'Angela Lopez', role: 'Manager', email: 'angela@shamzpizza.com', status: 'Active', joinedAt: '2026-04-01' }
  ];

  // Inventory properties
  inventoryList: InventoryItem[] = [
    { id: '1', name: 'Pepperoni Slices', category: 'Meats', stockQty: 250, unit: 'oz', minAlert: 50, available: true },
    { id: '2', name: 'Mozzarella Cheese Blend', category: 'Cheese', stockQty: 180, unit: 'lbs', minAlert: 40, available: true },
    { id: '3', name: 'San Marzano Sauce', category: 'Sauce', stockQty: 80, unit: 'lbs', minAlert: 20, available: true },
    { id: '4', name: 'Jalapeño Rings', category: 'Veggies', stockQty: 0, unit: 'oz', minAlert: 10, available: false }
  ];

  // Payout History
  payoutHistory: PayoutRecord[] = [
    { id: 'PO-920482', date: '2026-07-01', amount: 1402.50, status: 'Completed', bankAccount: 'Chase Bank (...9821)' },
    { id: 'PO-882104', date: '2026-06-15', amount: 1120.00, status: 'Completed', bankAccount: 'Chase Bank (...9821)' },
    { id: 'PO-842918', date: '2026-06-01', amount: 980.75, status: 'Completed', bankAccount: 'Chase Bank (...9821)' }
  ];

  // Reviews
  mockReviews = [
    { author: 'David K.', rating: 5, date: '2026-07-08', comment: 'The Detroit square deep dish is easily the best value for money in the city. The crust is amazingly crispy!' },
    { author: 'Sarah M.', rating: 4, date: '2026-07-06', comment: 'Super fast delivery and prices compared on MiSlice were accurate. The garlic butter crust flavor is fantastic.' }
  ];

  // Exact 9 requested tabs
  tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'orders', name: 'Orders', icon: '📦' },
    { id: 'menu', name: 'Menu Manager', icon: '🍕' },
    { id: 'deals', name: 'Deals & Promos', icon: '🏷️' },
    { id: 'reviews', name: 'Reviews & Ratings', icon: '⭐' },
    { id: 'hours', name: 'Store Hours', icon: '⏰' },
    { id: 'insights', name: 'Insights & Sales', icon: '📈' },
    { id: 'finance', name: 'Financials/Billing', icon: '💳' },
    { id: 'staff', name: 'Team Members', icon: '👥' }
  ];

  itemTypes = ['PIZZA', 'SIDE', 'DRINK', 'DESSERT', 'COMBO'];
  newItem: { name: string; basePrice: number; itemType: string } = { name: '', basePrice: 9.99, itemType: 'PIZZA' };
  newDeal: { title: string; description: string; originalPrice: number | null; discountedPrice: number | null } =
    { title: '', description: '', originalPrice: null, discountedPrice: null };

  // KPI Computeds
  netEarnings = computed(() =>
    this.orders().reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 0.8);
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
    this.restaurantService.getMyRestaurants().subscribe({
      next: (data) => {
        this.shops.set(data);
        this.shopsLoaded.set(true);
        if (data.length > 0) {
          this.selectShop(data[0]);
        }
      },
      error: () => this.shopsLoaded.set(true)
    });
  }

  selectShop(shop: Store) {
    this.selectedShop.set(shop);
    this.online.set(shop.acceptingOrders);
    this.loadOrders();
    this.loadMenu();
    this.loadDeals();
  }

  loadOrders() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingOrders.set(true);
    this.orderService.getRestaurantOrders(shop.id).subscribe({
      next: (ordersList) => { this.orders.set(ordersList); this.loadingOrders.set(false); },
      error: () => this.loadingOrders.set(false)
    });
  }

  loadMenu() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingMenu.set(true);
    this.menuService.getMenuItems(shop.id).subscribe({
      next: (items) => { this.menuItems.set(items); this.loadingMenu.set(false); },
      error: () => this.loadingMenu.set(false)
    });
  }

  loadDeals() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingDeals.set(true);
    this.restaurantService.getRestaurantDeals(shop.id).subscribe({
      next: (list) => { this.deals.set(list); this.loadingDeals.set(false); },
      error: () => this.loadingDeals.set(false)
    });
  }

  updateStatus(orderId: string, status: string) {
    this.orderService.updateOrderStatus(orderId, status, 'Kitchen Operator', `Transitioned to ${status}`).subscribe({
      next: () => this.loadOrders()
    });
  }

  // --- Menu management ---
  saveItem(item: MenuItem) {
    const shop = this.selectedShop();
    if (!shop) return;
    this.savingItem.set(true);
    this.menuService.saveMenuItem(shop.id, item).subscribe({
      next: () => this.savingItem.set(false),
      error: () => this.savingItem.set(false)
    });
  }

  toggleAvailability(item: MenuItem) {
    const shop = this.selectedShop();
    if (!shop) return;
    const next = !item.available;
    this.menuService.updateAvailability(shop.id, item.id, next).subscribe({
      next: () => this.menuItems.update(list => list.map(i => i.id === item.id ? { ...i, available: next } : i))
    });
  }

  addItem() {
    const shop = this.selectedShop();
    if (!shop || !this.newItem.name.trim()) return;
    this.savingItem.set(true);
    this.menuService.saveMenuItem(shop.id, {
      name: this.newItem.name.trim(),
      basePrice: Number(this.newItem.basePrice) || 0,
      itemType: this.newItem.itemType as MenuItem['itemType'],
      available: true
    }).subscribe({
      next: () => {
        this.newItem = { name: '', basePrice: 9.99, itemType: 'PIZZA' };
        this.savingItem.set(false);
        this.loadMenu();
      },
      error: () => this.savingItem.set(false)
    });
  }

  deleteItem(item: MenuItem) {
    const shop = this.selectedShop();
    if (!shop) return;
    this.menuService.deleteMenuItem(shop.id, item.id).subscribe({
      next: () => this.menuItems.update(list => list.filter(i => i.id !== item.id))
    });
  }

  // --- Deals management ---
  addDeal() {
    const shop = this.selectedShop();
    if (!shop || !this.newDeal.title.trim()) return;
    this.savingDeal.set(true);
    this.restaurantService.saveDeal(shop.id, {
      title: this.newDeal.title.trim(),
      description: this.newDeal.description.trim(),
      originalPrice: this.newDeal.originalPrice ?? undefined,
      discountedPrice: this.newDeal.discountedPrice ?? undefined,
      active: true
    }).subscribe({
      next: () => {
        this.newDeal = { title: '', description: '', originalPrice: null, discountedPrice: null };
        this.savingDeal.set(false);
        this.loadDeals();
      },
      error: () => this.savingDeal.set(false)
    });
  }

  toggleDeal(deal: Deal) {
    const shop = this.selectedShop();
    if (!shop) return;
    this.restaurantService.saveDeal(shop.id, { ...deal, active: !deal.active }).subscribe({
      next: () => this.loadDeals()
    });
  }

  // --- Quick Actions Launcher ---
  applyQuickAction(type: string): void {
    const shop = this.selectedShop();
    if (!shop) return;
    this.savingDeal.set(true);
    this.successMsg.set('');

    let dealData: any = {};
    if (type === '10%') {
      dealData = {
        title: '⚡ Flash 10% Off All Pizzas!',
        description: 'Get a quick 10% discount on all items in our menu catalog.',
        active: true
      };
    } else if (type === '20%') {
      dealData = {
        title: '🔥 Super Saver 20% Discount',
        description: 'Enjoy 20% discount on all orders placed via the MiSlice marketplace this week!',
        active: true
      };
    } else if (type === 'BOGO') {
      dealData = {
        title: '🍕 Buy One Get One (BOGO) Special',
        description: 'Buy any large custom pizza and get a medium cheese pizza free!',
        active: true
      };
    } else if (type === 'FREE_DELIVERY') {
      dealData = {
        title: '🚗 Free Delivery Promotion',
        description: 'No delivery fee on all orders this weekend!',
        active: true
      };
    }

    this.restaurantService.saveDeal(shop.id, dealData).subscribe({
      next: () => {
        this.savingDeal.set(false);
        this.loadDeals();
        this.successMsg.set(`Campaign "${dealData.title}" launched successfully!`);
        setTimeout(() => this.successMsg.set(''), 4000);
      },
      error: (err) => {
        this.savingDeal.set(false);
        console.error('Failed to apply quick action deal:', err);
      }
    });
  }

  // --- Settings / Hours ---
  toggleOnline() {
    const shop = this.selectedShop();
    if (!shop) return;
    const next = !this.online();
    this.online.set(next);
    const updated = { ...shop, acceptingOrders: next };
    this.selectedShop.set(updated);
    this.restaurantService.updateRestaurant(shop.id, updated).subscribe({
      error: () => { this.online.set(!next); }
    });
  }

  saveSettings() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.savingSettings.set(true);
    this.settingsSaved.set(false);
    this.restaurantService.updateRestaurant(shop.id, shop).subscribe({
      next: (saved) => {
        this.selectedShop.set(saved);
        this.shops.update(list => list.map(s => s.id === saved.id ? saved : s));
        this.savingSettings.set(false);
        this.settingsSaved.set(true);
        setTimeout(() => this.settingsSaved.set(false), 2500);
      },
      error: () => this.savingSettings.set(false)
    });
  }

  // --- Staff Management mock actions ---
  inviteStaff() {
    if (!this.newStaff.name.trim() || !this.newStaff.email.trim()) return;
    this.staffList.push({
      id: Math.random().toString(),
      name: this.newStaff.name.trim(),
      role: this.newStaff.role,
      email: this.newStaff.email.trim(),
      status: 'Pending',
      joinedAt: new Date().toISOString().split('T')[0]
    });
    this.newStaff = { name: '', email: '', role: 'Manager' };
    this.showInviteStaff.set(false);
  }

  // --- Financials Instant Payout Mock ---
  requestPayout(): void {
    const earnings = this.netEarnings();
    if (earnings <= 0) return;
    
    this.successMsg.set('');
    this.payoutHistory.unshift({
      id: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: earnings,
      status: 'Completed',
      bankAccount: 'Chase Bank (...9821)'
    });
    
    this.successMsg.set(`Instant payout request of ${earnings.toFixed(2)} approved & initiated successfully!`);
    setTimeout(() => this.successMsg.set(''), 5000);
  }

  // --- OCR Menu Import Actions ---
  onMenuFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    const shop = this.selectedShop();
    if (!file || !shop) return;

    this.processingOcr.set(true);
    this.ocrError.set('');
    this.ocrSuggestions.set([]);

    this.menuService.importMenuOcr(shop.id, file).subscribe({
      next: (suggestions) => {
        this.ocrSuggestions.set(suggestions.map(s => ({ ...s, selected: true })));
        this.processingOcr.set(false);
      },
      error: (err) => {
        this.processingOcr.set(false);
        this.ocrError.set(err?.error?.message || 'Failed to process menu image. Please try again.');
        console.error('OCR Processing error:', err);
      }
    });
  }

  importSelectedOcrItems(): void {
    const shop = this.selectedShop();
    const selected = this.ocrSuggestions().filter(s => s.selected);
    if (!shop || selected.length === 0) return;

    this.importingOcr.set(true);

    const requests = selected.map(item => 
      this.menuService.saveMenuItem(shop.id, {
        name: item.name.trim(),
        basePrice: Number(item.basePrice) || 0,
        itemType: item.itemType,
        description: item.description,
        available: true
      })
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.importingOcr.set(false);
        this.ocrSuggestions.set([]);
        this.loadMenu();
        this.successMsg.set('Successfully imported items from menu photo!');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.importingOcr.set(false);
        this.ocrError.set('Failed to import some menu items.');
        console.error('Import error:', err);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'CANCELLED': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'PREPARING': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-white/10 text-white/70 border border-white/10';
    }
  }
}
