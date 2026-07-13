import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { MenuService } from '../../core/services/menu.service';
import { ReviewService } from '../../core/services/review.service';
import { Store, OrderDto, MenuItem, Deal, ReviewDto } from '../../shared/models';

interface StaffMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Chef' | 'Driver' | 'Cashier';
  email: string;
  status: 'Active' | 'Pending';
  joinedAt: string;
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
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, RouterLink],
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
      <div *ngIf="selectedShop()" class="grid gap-6 items-start owner-grid" [class.nav-collapsed]="navCollapsed()">

        <!-- Sidebar Navigation (collapsible) -->
        <div class="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none shrink-0 lg:w-full min-w-0">

          <!-- Collapse toggle (desktop) -->
          <button (click)="navCollapsed.set(!navCollapsed())" [title]="navCollapsed() ? 'Expand menu' : 'Collapse menu'"
            class="hidden lg:flex items-center h-9 mb-1 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
            [class.justify-center]="navCollapsed()" [class.justify-end]="!navCollapsed()" [class.px-3]="!navCollapsed()">
            <span class="text-base">{{ navCollapsed() ? '»' : '«' }}</span>
          </button>

          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)" [title]="tab.name"
              [class]="'glare-hover rounded-2xl text-xs font-black transition flex items-center gap-3 whitespace-nowrap min-w-[132px] lg:min-w-0 py-3 ' +
                (navCollapsed() ? 'lg:justify-center lg:px-0 px-4' : 'px-4') + ' ' +
                (activeTab() === tab.id
                  ? 'bg-gradient-to-r from-red-700/80 to-orange-600/50 text-white border border-red-500/30 shadow-md shadow-red-600/10'
                  : 'text-white/60 hover:text-white')">
              <span class="text-base leading-none">{{ tab.icon }}</span>
              <span [class.lg:hidden]="navCollapsed()">{{ tab.name }}</span>
            </button>
          }

          <!-- Bottom: Help & Support -->
          <div class="hidden lg:block pt-3 mt-2 border-t border-white/10 space-y-1">
            <a routerLink="/how-it-works" title="Help Center"
              [class]="'glare-hover flex items-center gap-3 rounded-2xl text-[11px] font-bold text-white/50 hover:text-white transition py-2.5 ' + (navCollapsed() ? 'justify-center px-0' : 'px-4')">
              <span class="text-sm">❓</span><span [class.hidden]="navCollapsed()">Help Center</span>
            </a>
            <a routerLink="/contact" title="Contact Support"
              [class]="'glare-hover flex items-center gap-3 rounded-2xl text-[11px] font-bold text-white/50 hover:text-white transition py-2.5 ' + (navCollapsed() ? 'justify-center px-0' : 'px-4')">
              <span class="text-sm">✉️</span><span [class.hidden]="navCollapsed()">Contact Support</span>
            </a>
          </div>
        </div>

        <!-- Selected Tab View Content -->
        <div class="glass rounded-[2rem] p-6 min-h-[500px] border border-white/10 bg-black/35 shadow-2xl space-y-6">

          <!-- TAB 1: OVERVIEW (Overview KPIs, Quick Actions, AI Insights) -->
          <div *ngIf="showsPanel('overview')" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">📊 Operations Dashboard</h3>
                <p class="text-xs text-white/50 mt-0.5">Real-time overview of metrics, instant campaigns, and AI guidance.</p>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">LIVE DATA</span>
            </div>

            <!-- QUICK ACTIONS PANEL -->
            <div class="glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-neutral-900 to-red-955/10 space-y-3 shadow-md">
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
            <div class="glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-neutral-900 via-red-955/15 to-blue-955/10 space-y-3.5 shadow-lg relative overflow-hidden">
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
          </div>

          <!-- TAB 2: STORE PROFILE (Store settings, Operating Hours, info) -->
          <div *ngIf="showsPanel('profile')" class="space-y-4 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">🏢 Store Profile &amp; Settings</h3>
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
                  {{ savingSettings() ? 'Saving Profile...' : 'Save Operations Settings' }}
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

          <!-- TAB 3: MENU BUILDER (Category selector, Pizza list, OCR upload) -->
          <div *ngIf="showsPanel('menu')" class="space-y-4 animate-fadeIn">
            <div class="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">🍕 Menu Builder</h3>
                <p class="text-xs text-white/50 mt-0.5">Configure your categories and visual items catalog.</p>
              </div>
              <button (click)="showManualAdd.set(!showManualAdd())"
                class="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5">
                ➕ Add Item
              </button>
            </div>

            <!-- Manual Item Form -->
            <div *ngIf="showManualAdd()" class="glass rounded-2xl p-5 border border-white/5 space-y-3 bg-white/5 animate-fadeIn">
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

            <!-- Categories Selector Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div *ngFor="let cat of menuCategories; let i = index" (click)="selectedMenuCategory.set(cat)"
                [class]="selectedMenuCategory() === cat 
                  ? 'p-4 rounded-xl border font-bold text-center cursor-pointer transition bg-red-600/20 border-red-500 text-red-500' 
                  : 'p-4 rounded-xl border font-bold text-center cursor-pointer transition bg-white/5 border-white/10 text-stone-400 hover:bg-white/10 hover:text-white'">
                {{ cat }}
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
              </div>

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

            <!-- Live Menu Items List -->
            <div *ngIf="loadingMenu()" class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
            </div>

            <div *ngIf="!loadingMenu() && filteredMenuItems().length === 0" class="text-center py-10 text-white/40 text-xs">
              No items found in category "{{ selectedMenuCategory() }}".
            </div>

            <div class="space-y-4">
              <div *ngFor="let item of filteredMenuItems()" class="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center text-xl">🍕</div>
                  <div>
                    <p class="text-white font-bold">{{ item.name }}</p>
                    <p class="text-xs text-stone-500">Base Price: {{ item.basePrice | currency }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button (click)="saveItem(item)"
                    class="text-xs font-bold text-stone-400 hover:text-white px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition">Save</button>
                  <button (click)="toggleAvailability(item)"
                    [class]="'text-xs font-bold px-3 py-1 rounded-lg transition ' + (item.available ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20')">
                    {{ item.available ? 'Active' : 'Disable' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: PRICE MANAGER (Quick item list base price editor) -->
          <div *ngIf="showsPanel('price')" class="space-y-4 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">💰 Price Manager</h3>
              <p class="text-xs text-white/50 mt-0.5">Quickly edit all menu item prices on a single spreadsheet grid.</p>
            </div>

            <div class="glass-soft rounded-2xl border border-white/5 overflow-hidden">
              <table class="w-full text-xs text-left text-white/70">
                <thead class="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
                  <tr>
                    <th class="px-4 py-3">Item Name</th>
                    <th class="px-4 py-3">Category</th>
                    <th class="px-4 py-3">Current Price</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-black/10">
                  <tr *ngFor="let item of menuItems()">
                    <td class="px-4 py-3 text-white font-bold">{{ item.name }}</td>
                    <td class="px-4 py-3"><span class="bg-white/5 px-2 py-0.5 rounded text-[10px] font-black uppercase">{{ item.itemType }}</span></td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1.5">
                        <span class="text-white/40">$</span>
                        <input type="number" [(ngModel)]="item.basePrice" min="0" step="0.01"
                          class="w-24 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-red-500" />
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button (click)="saveItem(item)"
                        class="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px]">
                        Save
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 5: LIVE ORDERS (4-Column Status Kanban Board) -->
          <div *ngIf="showsPanel('orders')" class="space-y-6 animate-fadeIn">
            <div class="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">📦 Live Orders Board</h3>
                <p class="text-xs text-white/50 mt-0.5">Drag-like pipeline for processing new, active, and ready orders.</p>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">LIVE RADAR</span>
            </div>

            <!-- Status sub-tabs -->
            <div class="flex gap-1 bg-white/5 p-1 rounded-xl w-fit overflow-x-auto scrollbar-none">
              @for (st of orderStatusTabs; track st.id) {
                <button (click)="orderStatusTab.set(st.id)"
                  [class]="'px-3 py-1.5 rounded-lg text-[11px] font-black transition whitespace-nowrap ' + (orderStatusTab() === st.id ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white')">{{ st.label }}</button>
              }
            </div>

            <!-- Active pipeline (Kanban) -->
            <div *ngIf="orderStatusTab() === 'active'" class="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <!-- Kanban columns -->
              <div *ngFor="let col of kanbanColumns" class="bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden h-[600px]">
                <div class="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 [class]="col.color" class="font-black text-xs uppercase tracking-wider">{{ col.title }}</h3>
                  <span class="bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold text-white">{{ col.items.length }}</span>
                </div>
                <div class="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none cursor-pointer">
                  <div *ngFor="let order of col.items" [class]="'bg-white/5 border ' + col.border + ' rounded-xl p-4 hover:bg-white/10 transition-colors'">
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-xs font-bold text-white">#{{ order.id.slice(-4).toUpperCase() }}</span>
                      <span class="text-xs font-black text-emerald-400">{{ order.total | currency }}</span>
                    </div>
                    <div class="text-xs text-stone-300 space-y-1 mb-3">
                      <div *ngFor="let item of order.items">
                        <b class="text-white">{{ item.quantity }}x</b> {{ item.itemName }}
                      </div>
                    </div>
                    
                    <select [value]="order.status.toLowerCase()" 
                      (change)="onOrderStatusDropdownChange(order.id, order.status, $event)"
                      class="w-full bg-black border border-white/20 text-xs font-bold text-stone-300 rounded-lg p-2 focus:outline-none focus:border-red-500 capitalize">
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready_for_pickup">Ready for Pickup</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fulfilled / Cancelled / Refunded history -->
            <div *ngIf="orderStatusTab() !== 'active'" class="space-y-2">
              <div *ngFor="let o of ordersByStatus()" class="glass rounded-xl p-3 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="font-bold text-white">#{{ o.orderNumber }}</span>
                <span [class]="getStatusClass(o.status)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{{ o.status }}</span>
                <span class="text-white/50">{{ o.placedAt | date:'MMM d, h:mm a' }}</span>
                <span class="font-black text-white">{{ o.total | currency }}</span>
              </div>
              <p *ngIf="ordersByStatus().length === 0" class="text-xs text-white/40 text-center py-8">No {{ orderStatusTab() }} orders.</p>
            </div>
          </div>

          <!-- TAB 6: RECEIPTS (Completed Transactions History list) -->
          <div *ngIf="showsPanel('receipts')" class="space-y-4 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">🧾 Order Receipts History</h3>
              <p class="text-xs text-white/50 mt-0.5">Monitor and export all completed receipt parameters for auditing.</p>
            </div>

            <div class="glass-soft rounded-2xl border border-white/5 overflow-hidden">
              <table class="w-full text-xs text-left text-white/70">
                <thead class="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
                  <tr>
                    <th class="px-4 py-3">Receipt ID</th>
                    <th class="px-4 py-3">Customer Email</th>
                    <th class="px-4 py-3">Discharge Date</th>
                    <th class="px-4 py-3">Net Payment</th>
                    <th class="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-black/10">
                  <tr *ngFor="let order of completedOrdersList()">
                    <td class="px-4 py-3 font-mono text-[10px] text-white font-bold">REC-{{ order.id.slice(-6).toUpperCase() }}</td>
                    <td class="px-4 py-3">{{ 'customer@mislice.com' }}</td>
                    <td class="px-4 py-3">{{ order.placedAt | date:'medium' }}</td>
                    <td class="px-4 py-3 text-emerald-400 font-bold">{{ order.total | currency }}</td>
                    <td class="px-4 py-3 text-emerald-400">Paid</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 7: PAYMENTS & PAYOUTS -->
          <div *ngIf="showsPanel('payouts')" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">💳 Payments &amp; Payouts</h3>
                <p class="text-xs text-white/50 mt-0.5">Disburse weekly store earnings minus the platform commission.</p>
              </div>
              <button (click)="requestPayout()" [disabled]="netEarnings() <= 0"
                class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/10">
                Request Instant Payout 💰
              </button>
            </div>

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
                      <th class="px-4 py-3">Amount</th>
                      <th class="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 bg-black/10">
                    <tr *ngFor="let p of payoutHistory">
                      <td class="px-4 py-3 font-mono text-[10px]">{{ p.id }}</td>
                      <td class="px-4 py-3">{{ p.date }}</td>
                      <td class="px-4 py-3 text-white font-bold">{{ p.amount | currency }}</td>
                      <td class="px-4 py-3 text-emerald-400 font-bold">✓ {{ p.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 8: DEALS & COUPONS (Quick campaign setup) -->
          <div *ngIf="showsPanel('deals')" class="space-y-4 animate-fadeIn">
            <div class="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">🏷️ Deals &amp; Offers</h3>
                <p class="text-xs text-white/50 mt-0.5">Publish special discount rates and campaign specials visible on the comparison board.</p>
              </div>
              <button (click)="showManualDeal.set(!showManualDeal())"
                class="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5">
                ➕ Create Deal
              </button>
            </div>

            <!-- Quick Template Deals Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div *ngFor="let type of ['20% Off', 'Buy One Get One', 'Free Delivery']" (click)="applyQuickAction(type)"
                class="bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:border-red-500/50 cursor-pointer transition-all">
                <div class="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">➕</div>
                <p class="text-white font-bold text-sm">{{ type }}</p>
              </div>
            </div>

            <!-- Custom Deal Form -->
            <div *ngIf="showManualDeal()" class="glass rounded-2xl p-5 border border-white/5 space-y-3 bg-white/5 animate-fadeIn">
              <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Create Custom Promo / Coupon</h4>
              <div class="space-y-3 text-xs">
                <div>
                  <label class="block text-[10px] text-white/40 mb-1 font-bold">Deal Title</label>
                  <input type="text" [(ngModel)]="newDeal.title" placeholder="Double Play: 2 Mediums for $19.99"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                </div>
                <div>
                  <label class="block text-[10px] text-white/40 mb-1 font-bold">Description</label>
                  <input type="text" [(ngModel)]="newDeal.description" placeholder="Include toppings limit or size details"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1 font-bold">Original Price ($)</label>
                    <input type="number" [(ngModel)]="newDeal.originalPrice" placeholder="24.99" min="0" step="0.01"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-white/40 mb-1 font-bold">Sale / Deal Price ($)</label>
                    <input type="number" [(ngModel)]="newDeal.discountedPrice" placeholder="19.99" min="0" step="0.01"
                      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                  </div>
                </div>
                <button (click)="addDeal()" [disabled]="!newDeal.title.trim() || savingDeal()"
                  class="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-black rounded-xl transition shadow-lg mt-2 text-xs">
                  Publish Campaign 🏷️
                </button>
              </div>
            </div>

            <!-- Active Deals List -->
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-white mb-4">Active Coupons</h3>
              <div *ngIf="loadingDeals()" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-red-500"></div>
              </div>
              <div *ngIf="!loadingDeals() && deals().length === 0" class="text-center py-8 text-white/40 text-xs">
                No active deals found.
              </div>
              <div *ngFor="let deal of deals()" class="glass rounded-xl p-4 border border-white/5 flex justify-between items-center text-xs bg-white/5">
                <div>
                  <p class="text-white font-bold text-sm">{{ deal.title }}</p>
                  <p class="text-xs font-bold text-green-400 mt-1">
                    {{ deal.discountedPrice | currency }}
                    <span class="text-stone-500 line-through font-normal ml-1" *ngIf="deal.originalPrice">{{ deal.originalPrice | currency }}</span>
                  </p>
                </div>
                <button (click)="toggleDeal(deal)"
                  [class]="'text-xs font-bold px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition ' + (deal.active ? 'text-emerald-400' : 'text-red-400')">
                  {{ deal.active ? 'Disable' : 'Enable' }}
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 9: ANALYTICS -->
          <div *ngIf="showsPanel('analytics')" class="space-y-6 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-white">📊 Analytics</h3>
              <p class="text-xs text-white/50 mt-0.5">Detailed metrics regarding average order value, conversion rates, and item performance.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Top Selling Pizzas -->
              <div class="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl">
                <h3 class="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Top Selling Pizzas</h3>
                <div class="space-y-4 text-xs">
                  <div *ngFor="let pizza of topSellingPizzas">
                    <div class="flex justify-between font-bold text-white mb-1">
                      <span>{{ pizza.name }}</span>
                      <span>{{ pizza.pct }}%</span>
                    </div>
                    <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div class="bg-red-500 h-full rounded-full" [style.width.%]="pizza.pct"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery vs Pickup donut chart -->
              <div class="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center">
                <h3 class="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4 w-full text-left">Delivery vs Pickup</h3>
                <div class="w-32 h-32 rounded-full border-[14px] border-red-500 border-r-blue-500 relative flex items-center justify-center">
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-xl font-black text-white">
                    <span>65%</span>
                    <span class="text-[8px] uppercase tracking-widest text-white/40">Delivery</span>
                  </div>
                </div>
                <div class="flex justify-center gap-6 mt-6 text-xs font-bold">
                  <span class="flex items-center gap-2 text-white"><div class="w-3 h-3 bg-red-500 rounded-sm"></div> Delivery</span>
                  <span class="flex items-center gap-2 text-white"><div class="w-3 h-3 bg-blue-500 rounded-sm"></div> Pickup</span>
                </div>
              </div>
            </div>
          </div>

          <!-- USERS / STAFF MANAGEMENT -->
          <div *ngIf="showsPanel('users')" class="space-y-5 animate-fadeIn">
            <div class="border-b border-white/5 pb-3">
              <h3 class="text-lg font-black text-white">👥 Users &amp; Staff</h3>
              <p class="text-xs text-white/50 mt-0.5">Invite team members and manage who can access this store.</p>
            </div>

            <!-- Add user -->
            <div class="glass rounded-2xl p-4 border border-white/5">
              <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Add a user</p>
              <div class="grid sm:grid-cols-[1fr_1fr_130px_auto] gap-2">
                <input [(ngModel)]="newUser.name" placeholder="Full name" class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-500" />
                <input [(ngModel)]="newUser.email" placeholder="Email" class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-500" />
                <select [(ngModel)]="newUser.role" class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-500">
                  <option class="bg-neutral-900" *ngFor="let r of staffRoles" [value]="r">{{ r }}</option>
                </select>
                <button (click)="addUser()" [disabled]="!newUser.name.trim() || !newUser.email.trim()" class="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition whitespace-nowrap">+ Invite</button>
              </div>
            </div>

            <!-- Manage users -->
            <div class="space-y-2">
              <div *ngFor="let u of staff()" class="glass rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black text-red-400">{{ u.name.substring(0,1).toUpperCase() }}</div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-white truncate">{{ u.name }} <span class="text-[9px] font-black uppercase tracking-wider bg-white/5 text-white/50 px-1.5 py-0.5 rounded ml-1">{{ u.role }}</span></p>
                    <p class="text-[10px] text-white/40 truncate">{{ u.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span [class]="'text-[9px] font-black uppercase px-2 py-1 rounded-full ' + (u.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400')">{{ u.status }}</span>
                  <button *ngIf="u.role !== 'Owner'" (click)="removeUser(u)" class="text-[10px] font-bold text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>
              <p *ngIf="staff().length === 0" class="text-xs text-white/40 text-center py-6">No team members yet. Invite your first one above.</p>
            </div>
          </div>

          <!-- DELIVERY -->
          <div *ngIf="showsPanel('delivery')" class="space-y-5 animate-fadeIn">
            <div class="border-b border-white/5 pb-3">
              <h3 class="text-lg font-black text-white">🛵 Delivery</h3>
              <p class="text-xs text-white/50 mt-0.5">Delivery settings and orders currently on the road.</p>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
              <div class="glass rounded-2xl p-4 border border-white/5">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Delivery Radius</p>
                <input type="number" [(ngModel)]="selectedShop()!.deliveryRadiusMiles" class="w-full bg-transparent text-2xl font-black text-white outline-none mt-1" /> <span class="text-xs text-white/40">miles</span>
              </div>
              <div class="glass rounded-2xl p-4 border border-white/5">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Delivery Fee</p>
                <div class="flex items-baseline gap-1 mt-1"><span class="text-white/40">$</span><input type="number" [(ngModel)]="selectedShop()!.deliveryFee" class="w-full bg-transparent text-2xl font-black text-white outline-none" /></div>
              </div>
              <div class="glass rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/40">Avg Delivery ETA</p>
                <p class="text-2xl font-black text-white mt-1">{{ selectedShop()?.averageEtaMinutes || 30 }} <span class="text-xs text-white/40">min</span></p>
              </div>
            </div>
            <button (click)="saveSettings()" class="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition">Save Delivery Settings</button>

            <div class="pt-2">
              <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Out for delivery ({{ outForDeliveryOrders().length }})</p>
              <div class="space-y-2">
                <div *ngFor="let o of outForDeliveryOrders()" class="glass rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs">
                  <span class="font-bold text-white">#{{ o.orderNumber }}</span>
                  <span class="text-white/50">{{ o.total | currency }}</span>
                  <button (click)="updateStatus(o.id, 'DELIVERED')" class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">Mark Delivered</button>
                </div>
                <p *ngIf="outForDeliveryOrders().length === 0" class="text-xs text-white/40 text-center py-4">No active deliveries right now.</p>
              </div>
            </div>
          </div>

          <!-- AI INSIGHTS -->
          <div *ngIf="showsPanel('insights')" class="space-y-4 animate-fadeIn">
            <div class="border-b border-white/5 pb-3">
              <h3 class="text-lg font-black text-white">🤖 AI Insights</h3>
              <p class="text-xs text-white/50 mt-0.5">Smart suggestions generated from your store's activity.</p>
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div *ngFor="let ins of aiInsights()" class="glass rounded-2xl p-4 border border-white/5">
                <p class="text-2xl">{{ ins.icon }}</p>
                <p class="text-sm font-black text-white mt-2">{{ ins.title }}</p>
                <p class="text-xs text-white/50 mt-1 leading-relaxed">{{ ins.body }}</p>
              </div>
            </div>
          </div>

          <!-- NOTIFICATIONS -->
          <div *ngIf="showsPanel('notifications')" class="space-y-4 animate-fadeIn">
            <div class="border-b border-white/5 pb-3">
              <h3 class="text-lg font-black text-white">🔔 Notifications</h3>
              <p class="text-xs text-white/50 mt-0.5">Alerts that need your attention.</p>
            </div>
            <div class="space-y-2">
              <div *ngFor="let n of notifications()" class="glass rounded-xl p-3.5 border border-white/5 flex items-start gap-3">
                <span class="text-lg">{{ n.icon }}</span>
                <div class="min-w-0 flex-1"><p class="text-sm font-bold text-white">{{ n.title }}</p><p class="text-[11px] text-white/50 mt-0.5">{{ n.detail }}</p></div>
              </div>
              <p *ngIf="notifications().length === 0" class="text-xs text-white/40 text-center py-8">🎉 All caught up — no alerts right now.</p>
            </div>
          </div>

          <!-- REVIEWS -->
          <div *ngIf="showsPanel('reviews')" class="space-y-5 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 class="text-lg font-black text-white">⭐ Customer Reviews</h3>
                <p class="text-xs text-white/50 mt-0.5">See what customers say — and reply to build trust.</p>
              </div>
              <div class="flex gap-1 bg-white/5 p-1 rounded-xl">
                <button *ngFor="let f of reviewFilters" (click)="reviewFilter.set(f)"
                  [class]="'px-3 py-1 rounded-lg text-[10px] font-black capitalize ' + (reviewFilter() === f ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white')">{{ f }}</button>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="text-center shrink-0">
                <p class="text-4xl font-black text-white leading-none">{{ avgRating() | number:'1.1-1' }}</p>
                <p class="text-sm text-yellow-400 mt-1">{{ starStr(avgRating()) }}</p>
                <p class="text-[10px] text-white/40 mt-1">{{ reviews().length }} review{{ reviews().length === 1 ? '' : 's' }}</p>
              </div>
            </div>

            <div *ngIf="loadingReviews()" class="flex justify-center py-8"><div class="animate-spin rounded-full h-7 w-7 border-t-2 border-red-500"></div></div>
            <div *ngIf="!loadingReviews() && reviews().length === 0" class="text-center py-10 text-white/40 text-xs">
              No reviews yet. They'll appear here as customers rate their orders.
            </div>

            <div class="space-y-3">
              <div *ngFor="let r of filteredReviews()" class="glass rounded-2xl p-4 border border-white/5">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-bold text-white">{{ r.userFullName }}</span>
                  <span class="text-yellow-400 text-xs">{{ starStr(r.rating) }}</span>
                </div>
                <p class="text-xs text-white/60 mt-1.5 leading-relaxed">{{ r.comment }}</p>
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <span class="text-[10px] text-white/30">{{ r.createdAt | date:'mediumDate' }}</span>
                  <button class="text-[10px] font-black text-red-400 hover:text-red-300">↩ Reply</button>
                </div>
              </div>
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
    @media (min-width: 1024px) {
      .owner-grid { grid-template-columns: 208px minmax(0, 1fr); transition: grid-template-columns 0.3s ease; }
      .owner-grid.nav-collapsed { grid-template-columns: 60px minmax(0, 1fr); }
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
  private readonly reviewService = inject(ReviewService);

  shops = signal<Store[]>([]);
  shopsLoaded = signal(false);
  selectedShop = signal<Store | null>(null);
  orders = signal<OrderDto[]>([]);
  menuItems = signal<MenuItem[]>([]);
  deals = signal<Deal[]>([]);
  
  activeTab = signal('dashboard');
  navCollapsed = signal(false);
  selectedMenuCategory = signal('Pizzas');
  reviews = signal<ReviewDto[]>([]);
  loadingReviews = signal(false);
  reviewFilter = signal<'newest' | 'lowest' | 'highest'>('newest');
  reviewFilters: ('newest' | 'lowest' | 'highest')[] = ['newest', 'lowest', 'highest'];

  // Orders status sub-filter
  orderStatusTab = signal<'active' | 'fulfilled' | 'cancelled' | 'refunded'>('active');
  orderStatusTabs: { id: 'active' | 'fulfilled' | 'cancelled' | 'refunded'; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'fulfilled', label: 'Fulfilled / Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'refunded', label: 'Refunded' },
  ];

  // Users / staff management
  staff = signal<StaffMember[]>([]);
  newUser = { name: '', email: '', role: 'Manager' as StaffMember['role'] };
  staffRoles: StaffMember['role'][] = ['Manager', 'Chef', 'Cashier', 'Driver'];
  
  loadingOrders = signal(false);
  loadingMenu = signal(false);
  loadingDeals = signal(false);
  savingItem = signal(false);
  savingDeal = signal(false);
  savingSettings = signal(false);
  settingsSaved = signal(false);
  online = signal(true);

  showManualAdd = signal(false);
  showManualDeal = signal(false);
  
  // OCR processing signals
  ocrSuggestions = signal<any[]>([]);
  processingOcr = signal(false);
  importingOcr = signal(false);
  ocrError = signal('');
  successMsg = signal('');

  // Primary navigation — 7 sections. Each maps to one or more existing content
  // panels via `sectionPanels`, so no functionality is lost when consolidating.
  tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'orders', name: 'Orders', icon: '📦' },
    { id: 'menu', name: 'Menu', icon: '🍕' },
    { id: 'deals', name: 'Deals', icon: '🏷️' },
    { id: 'financials', name: 'Financials', icon: '💳' },
    { id: 'delivery', name: 'Delivery', icon: '🛵' },
    { id: 'reviews', name: 'Reviews', icon: '⭐' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'insights', name: 'AI Insights', icon: '🤖' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  private readonly sectionPanels: Record<string, string[]> = {
    dashboard: ['overview', 'analytics'],
    orders: ['orders'],
    menu: ['menu', 'price'],
    deals: ['deals'],
    financials: ['payouts', 'receipts'],
    delivery: ['delivery'],
    reviews: ['reviews'],
    users: ['users'],
    insights: ['insights'],
    notifications: ['notifications'],
    settings: ['profile'],
  };

  /** True when the active section includes the given legacy content panel. */
  showsPanel(panelId: string): boolean {
    return (this.sectionPanels[this.activeTab()] ?? [this.activeTab()]).includes(panelId);
  }

  menuCategories = ['Pizzas', 'Sizes', 'Crusts', 'Meat Tops', 'Veggie Tops', 'Drinks', 'Sides', 'Desserts'];

  topSellingPizzas = [
    { name: 'Pepperoni Square', pct: 34 },
    { name: 'Ultimate Meat Lovers', pct: 22 },
    { name: 'Classic Cheese Delight', pct: 18 }
  ];

  payoutHistory: PayoutRecord[] = [
    { id: 'PO-920482', date: '2026-07-01', amount: 1402.50, status: 'Completed', bankAccount: 'Chase Bank (...9821)' },
    { id: 'PO-882104', date: '2026-06-15', amount: 1120.00, status: 'Completed', bankAccount: 'Chase Bank (...9821)' }
  ];

  mockReviews = [
    { author: 'David K.', rating: 5, date: '2026-07-08', comment: 'The Detroit square deep dish is easily the best value for money in the city. The crust is amazingly crispy!' },
    { author: 'Sarah M.', rating: 4, date: '2026-07-06', comment: 'Super fast delivery and prices compared on MiSlice were accurate. The garlic butter crust flavor is fantastic.' }
  ];

  itemTypes = ['PIZZA', 'SIDE', 'DRINK', 'DESSERT', 'COMBO'];
  newItem = { name: '', basePrice: 9.99, itemType: 'PIZZA' };
  newDeal: { title: string; description: string; originalPrice: number | null; discountedPrice: number | null } =
    { title: '', description: '', originalPrice: null, discountedPrice: null };

  // KPI Computeds
  netEarnings = computed(() =>
    this.orders().reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 0.8);
  activeOrders = computed(() =>
    this.orders().filter(o => ['placed', 'confirmed', 'preparing', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length);

  // Kanban pipeline orders partitioning
  pendingOrdersList = computed(() =>
    this.orders().filter(o => ['pending', 'placed', 'confirmed', 'PENDING', 'PLACED', 'CONFIRMED'].includes(o.status.toLowerCase())));
  preparingOrdersList = computed(() =>
    this.orders().filter(o => ['preparing', 'PREPARING'].includes(o.status.toLowerCase())));
  readyOrdersList = computed(() =>
    this.orders().filter(o => ['ready_for_pickup', 'out_for_delivery', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status.toLowerCase())));
  completedOrdersList = computed(() =>
    this.orders().filter(o => ['delivered', 'cancelled', 'DELIVERED', 'CANCELLED'].includes(o.status.toLowerCase())));

  kanbanColumns = [
    { title: 'New', color: 'text-blue-400', border: 'border-blue-500/30', items: [] as OrderDto[] },
    { title: 'Preparing', color: 'text-amber-400', border: 'border-amber-500/30', items: [] as OrderDto[] },
    { title: 'Ready / Out', color: 'text-green-400', border: 'border-green-500/30', items: [] as OrderDto[] },
    { title: 'Completed', color: 'text-stone-400', border: 'border-white/10', items: [] as OrderDto[] }
  ];

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
    this.loadReviews();
    this.seedStaff();
  }

  loadReviews() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingReviews.set(true);
    this.reviewService.getReviewsForRestaurant(shop.id).subscribe({
      next: (list) => { this.reviews.set(list ?? []); this.loadingReviews.set(false); },
      error: () => this.loadingReviews.set(false),
    });
  }

  filteredReviews = computed<ReviewDto[]>(() => {
    const list = [...this.reviews()];
    switch (this.reviewFilter()) {
      case 'lowest': return list.sort((a, b) => a.rating - b.rating);
      case 'highest': return list.sort((a, b) => b.rating - a.rating);
      default: return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });

  avgRating = computed(() => {
    const list = this.reviews();
    if (!list.length) return this.selectedShop()?.ratingAvg ?? 0;
    return list.reduce((s, r) => s + r.rating, 0) / list.length;
  });

  starStr(n: number): string {
    const full = Math.round(n || 0);
    return '★'.repeat(Math.min(5, full)) + '☆'.repeat(Math.max(0, 5 - full));
  }

  // ---- Users / staff ----
  seedStaff() {
    const shop = this.selectedShop();
    this.staff.set([
      { id: 'owner', name: shop?.name ? shop.name + ' Owner' : 'Store Owner', role: 'Owner', email: 'owner@store.com', status: 'Active', joinedAt: '' },
    ]);
  }
  addUser() {
    const name = this.newUser.name.trim(), email = this.newUser.email.trim();
    if (!name || !email) return;
    this.staff.update(list => [...list, { id: Date.now().toString(), name, email, role: this.newUser.role, status: 'Pending', joinedAt: new Date().toISOString() }]);
    this.newUser = { name: '', email: '', role: 'Manager' };
  }
  removeUser(u: StaffMember) { this.staff.update(list => list.filter(x => x.id !== u.id)); }

  // ---- Orders by status sub-tab ----
  ordersByStatus = computed<OrderDto[]>(() => {
    const up = (s: string) => (s || '').toUpperCase();
    const list = this.orders();
    switch (this.orderStatusTab()) {
      case 'fulfilled': return list.filter(o => ['DELIVERED', 'COMPLETED', 'PICKED_UP'].includes(up(o.status)));
      case 'cancelled': return list.filter(o => up(o.status) === 'CANCELLED');
      case 'refunded': return list.filter(o => up(o.status) === 'REFUNDED' || up(o.paymentStatus) === 'REFUNDED');
      default: return list;
    }
  });

  // ---- Delivery ----
  outForDeliveryOrders = computed(() =>
    this.orders().filter(o => o.status?.toUpperCase() === 'OUT_FOR_DELIVERY'));

  // ---- AI insights (derived from real store data) ----
  aiInsights = computed(() => {
    const items = this.menuItems();
    const ordersList = this.orders();
    const topItem = items.length ? items.reduce((a, b) => (Number(a.basePrice) > Number(b.basePrice) ? a : b)) : null;
    const revenue = ordersList.reduce((s, o) => s + (Number(o.total) || 0), 0);
    return [
      { icon: '📈', title: 'Revenue snapshot', body: `You've booked ${this.formatMoney(revenue)} across ${ordersList.length} orders. Keep your best-sellers in stock to sustain the pace.` },
      { icon: '🍕', title: 'Menu spotlight', body: topItem ? `"${topItem.name}" is your premium item at ${this.formatMoney(Number(topItem.basePrice))}. Consider a combo deal to lift average order value.` : 'Add menu items to unlock pricing insights.' },
      { icon: '⏱️', title: 'Speed advantage', body: `Your avg prep/ETA is ${this.selectedShop()?.averageEtaMinutes || 25} min — highlight fast delivery to win nearby customers.` },
      { icon: '🏷️', title: 'Deal opportunity', body: this.deals().length ? `You have ${this.deals().length} active deal(s). Promote them in the Deals tab to drive repeat orders.` : 'No active deals — a limited-time offer can boost weekday traffic.' },
    ];
  });

  // ---- Notifications (derived from orders & reviews) ----
  notifications = computed(() => {
    const out: { icon: string; title: string; detail: string }[] = [];
    const pending = this.orders().filter(o => ['PENDING', 'PLACED'].includes(o.status?.toUpperCase()));
    if (pending.length) out.push({ icon: '⚠️', title: `${pending.length} order(s) waiting for acceptance`, detail: 'Open the Orders tab to accept and start preparing.' });
    if (!this.online()) out.push({ icon: '🔴', title: 'Your store is currently closed', detail: 'Toggle "Accepting Orders" to start receiving orders again.' });
    const lowReviews = this.reviews().filter(r => r.rating <= 2);
    if (lowReviews.length) out.push({ icon: '💬', title: `${lowReviews.length} low rating(s) to review`, detail: 'Reply to customers in the Reviews tab to rebuild trust.' });
    if (!this.deals().length) out.push({ icon: '🏷️', title: 'No active deals', detail: 'Create a promotion to attract more customers this week.' });
    return out;
  });

  private formatMoney(n: number): string { return '$' + (n || 0).toFixed(2); }

  loadOrders() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingOrders.set(true);
    this.orderService.getRestaurantOrders(shop.id).subscribe({
      next: (ordersList) => { 
        this.orders.set(ordersList); 
        this.loadingOrders.set(false);
        this.updateKanbanColumns(ordersList);
      },
      error: () => this.loadingOrders.set(false)
    });
  }

  updateKanbanColumns(list: OrderDto[]) {
    this.kanbanColumns = [
      { 
        title: 'New', 
        color: 'text-blue-400', 
        border: 'border-blue-500/30', 
        items: list.filter(o => ['pending', 'placed', 'confirmed', 'PENDING', 'PLACED', 'CONFIRMED'].includes(o.status)) 
      },
      { 
        title: 'Preparing', 
        color: 'text-amber-400', 
        border: 'border-amber-500/30', 
        items: list.filter(o => ['preparing', 'PREPARING'].includes(o.status)) 
      },
      { 
        title: 'Ready / Out', 
        color: 'text-green-400', 
        border: 'border-green-500/30', 
        items: list.filter(o => ['ready_for_pickup', 'out_for_delivery', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)) 
      },
      { 
        title: 'Completed', 
        color: 'text-stone-400', 
        border: 'border-white/10', 
        items: list.filter(o => ['delivered', 'cancelled', 'DELIVERED', 'CANCELLED'].includes(o.status)) 
      }
    ];
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

  filteredMenuItems = computed(() => {
    const category = this.selectedMenuCategory().toUpperCase();
    const items = this.menuItems();
    if (category === 'PIZZAS') {
      return items.filter(i => i.itemType === 'PIZZA');
    } else if (category === 'DRINKS') {
      return items.filter(i => i.itemType === 'DRINK');
    } else if (category === 'SIDES') {
      return items.filter(i => i.itemType === 'SIDE');
    } else if (category === 'DESSERTS') {
      return items.filter(i => i.itemType === 'DESSERT');
    }
    // Size, Crust, Meat Tops, Veggie Tops are handled dynamically (returning pizzas as default category filter)
    return items.filter(i => i.itemType === 'PIZZA');
  });

  loadDeals() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingDeals.set(true);
    this.restaurantService.getRestaurantDeals(shop.id).subscribe({
      next: (list) => { this.deals.set(list); this.loadingDeals.set(false); },
      error: () => this.loadingDeals.set(false)
    });
  }

  onOrderStatusDropdownChange(orderId: string, oldStatus: string, event: any) {
    const statusVal = event.target.value;
    this.updateStatus(orderId, statusVal);
  }

  updateStatus(orderId: string, status: string) {
    this.orderService.updateOrderStatus(orderId, status.toUpperCase(), 'Kitchen Operator', `Transitioned to ${status}`).subscribe({
      next: () => this.loadOrders()
    });
  }

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
        this.showManualAdd.set(false);
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
        this.showManualDeal.set(false);
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

  applyQuickAction(type: string): void {
    const shop = this.selectedShop();
    if (!shop) return;
    this.savingDeal.set(true);
    this.successMsg.set('');

    let dealData: any = {};
    if (type === '10%' || type === '10% Off') {
      dealData = {
        title: '⚡ Flash 10% Off All Pizzas!',
        description: 'Get a quick 10% discount on all items in our menu catalog.',
        active: true
      };
    } else if (type === '20%' || type === '20% Off') {
      dealData = {
        title: '🔥 Super Saver 20% Discount',
        description: 'Enjoy 20% discount on all orders placed via the MiSlice marketplace this week!',
        active: true
      };
    } else if (type === 'BOGO' || type === 'Buy One Get One') {
      dealData = {
        title: '🍕 Buy One Get One (BOGO) Special',
        description: 'Buy any large custom pizza and get a medium cheese pizza free!',
        active: true
      };
    } else if (type === 'FREE_DELIVERY' || type === 'Free Delivery') {
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

  inviteStaff() {
    // Staff details logic placeholder
  }

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
