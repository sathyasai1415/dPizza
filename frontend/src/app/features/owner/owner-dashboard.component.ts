import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { MerchantAlertsService, MerchantAlert } from '../../core/services/merchant-alerts.service';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { MenuService } from '../../core/services/menu.service';
import { ReviewService } from '../../core/services/review.service';
import { PayoutService, PayoutDto } from '../../core/services/payout.service';
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
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-7xl mx-auto py-6 px-4 space-y-6">

      <!-- MAIN HEADER CONSOLE -->
      <div class="clay rounded-[2rem] p-6 border border-brand-black flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="text-3xl">{{ selectedShop()?.emoji || '🏪' }}</span>
            <div>
              <h2 class="text-2xl font-black text-brand-black tracking-tight">{{ selectedShop()?.name || 'Merchant Control' }}</h2>
              <p class="text-xs text-brand-black font-medium">Store Console • ID: {{ selectedShop()?.id || 'Select a restaurant' }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <!-- Accepting orders toggle -->
          <div class="clay px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-brand-black bg-brand-white shrink-0 ml-auto md:ml-0">
            <span class="text-xs font-bold" [class.text-brand-green]="online()" [class.text-brand-black]="!online()">
              {{ online() ? '🟢 Accepting Orders' : '🔴 Closed / Offline' }}
            </span>
            <button (click)="toggleOnline()" [disabled]="!selectedShop()"
              [class]="'w-9 h-5 rounded-full relative transition ' + (online() ? 'text-brand-green font-bold' : 'bg-brand-white')">
              <span class="absolute top-0.5 w-4 h-4 rounded-full bg-brand-white transition-all shadow-md" [style.left]="online() ? '18px' : '2px'"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- SUCCESS / NOTIFICATION BANNERS -->
      @if (successMsg()) {
        <div class="clay border border-brand-green text-brand-green font-bold rounded-2xl p-4 text-center text-brand-green font-bold text-sm animate-fadeIn">
          ✅ {{ successMsg() }}
        </div>
      }
      @if (ocrError()) {
        <div class="clay border border-brand-red bg-brand-red text-brand-white rounded-2xl p-4 text-center text-brand-red font-bold text-sm animate-fadeIn">
          ⚠️ {{ ocrError() }}
        </div>
      }

      <!-- RESTAURANT SELECTOR -->
      <div *ngIf="shops().length > 1" class="clay rounded-3xl p-5 border border-brand-black space-y-3 bg-brand-white">
        <label class="block text-[10px] font-black text-brand-black uppercase tracking-widest">Select Managed Store</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button *ngFor="let shop of shops()" (click)="selectShop(shop)"
            [class]="selectedShop()?.id === shop.id 
              ? 'clay border border-brand-red bg-brand-red text-brand-white p-3 rounded-2xl text-left' 
              : 'clay p-3 rounded-2xl text-left hover:border-brand-black transition bg-brand-white'">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ shop.emoji }}</span>
              <h3 class="font-bold text-brand-black text-xs truncate">{{ shop.name }}</h3>
            </div>
            <p class="text-[9px] text-brand-black mt-1 truncate">{{ shop.city }}, MI</p>
          </button>
        </div>
      </div>

      <div *ngIf="!selectedShop() && shopsLoaded()" class="clay rounded-3xl p-12 text-center border border-brand-black">
        <p class="text-4xl mb-3">🏪</p>
        <p class="font-black text-brand-black text-lg">No Restaurants Registered</p>
        <p class="text-xs text-brand-black mt-1 max-w-sm mx-auto">Only the account registered as a RESTAURANT_OWNER can access this console.</p>
      </div>

      <!-- MAIN CONTENT — navigation now lives in the app sidebar under "Merchant Portal" -->
      <div *ngIf="selectedShop()">

        <!-- Selected Tab View Content -->
        <div class="clay rounded-[2rem] p-6 min-h-[500px] border border-brand-black bg-brand-white shadow-2xl space-y-6">

          <!-- TAB 1: OVERVIEW (Overview KPIs, Quick Actions, AI Insights) -->
          <div *ngIf="showsPanel('overview')" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">📊 Operations Dashboard</h3>
                <p class="text-xs text-brand-black mt-0.5">Real-time overview of metrics, instant campaigns, and AI guidance.</p>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest text-brand-green font-bold text-brand-green px-2 py-1 rounded-md border border-brand-green">LIVE DATA</span>
            </div>

            <!-- QUICK ACTIONS PANEL -->
            <div class="clay rounded-3xl p-5 border border-brand-black space-y-3 shadow-md">
              <h4 class="text-xs font-black uppercase text-brand-black tracking-wider flex items-center gap-1.5">
                ⚡ Quick Campaigns Launcher
              </h4>
              <p class="text-[10px] text-brand-black">Instantly publish pre-configured promotions to target buyers and rank higher on comparison quotes.</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button (click)="applyQuickAction('10%')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-brand-white hover:bg-brand-red text-brand-white border border-brand-black hover:border-brand-red text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🏷️</span>
                  <span class="text-xs font-black text-brand-black">10% Off Deal</span>
                  <span class="text-[9px] text-brand-black">Flash Discount</span>
                </button>
                <button (click)="applyQuickAction('20%')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-brand-white hover:bg-brand-red text-brand-white border border-brand-black hover:border-brand-red text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🔥</span>
                  <span class="text-xs font-black text-brand-black">20% Off Deal</span>
                  <span class="text-[9px] text-brand-black">Super Saver</span>
                </button>
                <button (click)="applyQuickAction('BOGO')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-brand-white hover:bg-brand-red text-brand-white border border-brand-black hover:border-brand-red text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🍕</span>
                  <span class="text-xs font-black text-brand-black">BOGO Deal</span>
                  <span class="text-[9px] text-brand-black">Buy 1 Get 1</span>
                </button>
                <button (click)="applyQuickAction('FREE_DELIVERY')" [disabled]="savingDeal()"
                  class="p-3.5 rounded-2xl bg-brand-white hover:bg-brand-red text-brand-white border border-brand-black hover:border-brand-red text-center transition flex flex-col items-center gap-1">
                  <span class="text-xl">🚗</span>
                  <span class="text-xs font-black text-brand-black">Free Delivery</span>
                  <span class="text-[9px] text-brand-black">No Delivery Fee</span>
                </button>
              </div>
            </div>

            <!-- AI INSIGHTS & recommendations PANEL -->
            <div class="clay rounded-3xl p-5 border border-brand-black space-y-3.5 shadow-lg relative overflow-hidden">
              <!-- Ambient background decoration -->
              <div class="absolute right-0 top-0 w-24 h-24 bg-brand-red text-brand-white rounded-full blur-xl pointer-events-none"></div>
              
              <div class="flex items-center justify-between border-b border-brand-black pb-2">
                <h4 class="text-xs font-black uppercase text-brand-red tracking-wider flex items-center gap-2">
                  🧠 MiSlice AI Pricing &amp; Operations Copilot
                </h4>
                <span class="text-[8px] font-black uppercase tracking-widest bg-brand-red text-brand-white text-brand-red px-2 py-0.5 rounded-md border border-brand-red">ADVANCED RECOMMENDATION</span>
              </div>
              
              <div class="grid gap-3">
                <div class="flex items-start gap-3 p-3 bg-brand-white rounded-2xl border border-brand-black hover:bg-brand-white transition">
                  <span class="text-lg shrink-0 mt-0.5">📊</span>
                  <div class="text-xs">
                    <p class="font-bold text-brand-black">Local Competitor Alert</p>
                    <p class="text-brand-black text-[11px] mt-0.5">Pizzerias in Midtown Detroit have lowered their average delivery fees to $1.99. Yours is currently $2.99, reducing quote conversions by 8.4%. Consider launching our <b>Free Delivery</b> special to reclaim top comparisons.</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 p-3 bg-brand-white rounded-2xl border border-brand-black hover:bg-brand-white transition">
                  <span class="text-lg shrink-0 mt-0.5">💡</span>
                  <div class="text-xs">
                    <p class="font-bold text-brand-black">Price Optimization Opportunity</p>
                    <p class="text-brand-black text-[11px] mt-0.5">Your "Detroit Deep Dish Pepperoni" has been compared 1,802 times this week with zero price bounce metrics. Standard margin parameters suggest raising its base price by $0.75 which would yield <b>+$135.15</b> weekly revenue with negligible volume loss.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bento Stats Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="clay rounded-2xl p-4 border border-brand-black to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">💰</span>
                  <span class="text-[10px] font-bold text-brand-green text-brand-green font-bold px-1.5 py-0.5 rounded-md">+12.3%</span>
                </div>
                <p class="text-2xl font-black text-brand-black mt-2">{{ netEarnings() | currency }}</p>
                <p class="text-[9px] font-bold text-brand-black uppercase tracking-widest mt-0.5">Net Revenue (80%)</p>
              </div>

              <div class="clay rounded-2xl p-4 border border-brand-black to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">📦</span>
                  <span class="text-[10px] font-bold text-brand-green text-brand-green font-bold px-1.5 py-0.5 rounded-md">+5</span>
                </div>
                <p class="text-2xl font-black text-brand-black mt-2">{{ orders().length }}</p>
                <p class="text-[9px] font-bold text-brand-black uppercase tracking-widest mt-0.5">Total Orders</p>
              </div>

              <div class="clay rounded-2xl p-4 border border-brand-black to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">🔥</span>
                  <span class="text-[10px] font-bold text-brand-orange bg-brand-orange text-brand-white px-1.5 py-0.5 rounded-md">Prep</span>
                </div>
                <p class="text-2xl font-black text-brand-black mt-2">{{ activeOrders() }}</p>
                <p class="text-[9px] font-bold text-brand-black uppercase tracking-widest mt-0.5">Active Kitchen</p>
              </div>

              <div class="clay rounded-2xl p-4 border border-brand-black to-white/0">
                <div class="flex justify-between items-start">
                  <span class="text-lg">⭐</span>
                  <span class="text-[10px] font-bold text-brand-orange text-brand-orange font-bold px-1.5 py-0.5 rounded-md">★★★★★</span>
                </div>
                <p class="text-2xl font-black text-brand-black mt-2">{{ selectedShop()?.ratingAvg || 4.8 }}</p>
                <p class="text-[9px] font-bold text-brand-black uppercase tracking-widest mt-0.5">Customer Rating</p>
              </div>
            </div>
          </div>

          <!-- TAB 2: STORE PROFILE (Store settings, Operating Hours, info) -->
          <div *ngIf="showsPanel('profile')" class="space-y-4 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">🏢 Store Profile &amp; Settings</h3>
                <p class="text-xs text-brand-black mt-0.5">Control operating hours schedule, delivery parameters, and contact info.</p>
              </div>
              <span *ngIf="settingsSaved()" class="text-[10px] font-black text-brand-green text-brand-green font-bold px-2.5 py-1.5 rounded-xl border border-brand-green animate-fadeIn">✓ Saved successfully</span>
            </div>

            <div class="grid sm:grid-cols-2 gap-6 text-xs">
              <div class="space-y-3">
                <p class="text-[10px] font-black text-brand-black uppercase tracking-widest border-b border-brand-black pb-1">Branding Details</p>
                <div>
                  <label class="block text-[10px] text-brand-black mb-1">Restaurant/Brand Name</label>
                  <input type="text" [(ngModel)]="selectedShop()!.name"
                    class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-[10px] text-brand-black mb-1">Tagline</label>
                  <input type="text" [(ngModel)]="selectedShop()!.tagline"
                    class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1">Phone Number</label>
                    <input type="text" [(ngModel)]="selectedShop()!.phone"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1">Category</label>
                    <input type="text" [(ngModel)]="selectedShop()!.category"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                </div>

                <p class="text-[10px] font-black text-brand-black uppercase tracking-widest border-b border-brand-black pb-1 pt-2">Pricing Parameters</p>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1">Min Order ($)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.minimumOrder" min="0" step="0.01"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1">Delivery Fee ($)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.deliveryFee" min="0" step="0.01"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1">Prep Time (min)</label>
                    <input type="number" [(ngModel)]="selectedShop()!.averageEtaMinutes" min="0"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                </div>

                <button (click)="saveSettings()" [disabled]="savingSettings()"
                  class="w-full py-3 hover:hover:disabled:opacity-40 text-brand-black font-black rounded-xl transition shadow-lg mt-3">
                  {{ savingSettings() ? 'Saving Profile...' : 'Save Operations Settings' }}
                </button>
              </div>

              <!-- Operating hours & info -->
              <div class="space-y-4">
                <div class="clay-soft rounded-2xl p-4 border border-brand-black space-y-3 bg-brand-white">
                  <h4 class="text-xs font-bold text-brand-black uppercase tracking-wider">Business Address Info</h4>
                  <div class="space-y-1 text-brand-black">
                    <p>📍 Address: <b>{{ selectedShop()?.addressLine }}, {{ selectedShop()?.city }}, {{ selectedShop()?.state }}</b></p>
                    <p>🌐 Website: <a [href]="selectedShop()?.website" target="_blank" class="text-brand-red hover:underline">{{ selectedShop()?.website || 'N/A' }}</a></p>
                  </div>
                </div>

                <!-- Operating hours widget -->
                <div class="clay-soft rounded-2xl p-4 border border-brand-black space-y-2 bg-brand-white">
                  <h4 class="text-xs font-bold text-brand-black uppercase tracking-wider">Weekly Operating Hours</h4>
                  <div class="space-y-1.5 text-brand-black">
                    <div class="flex justify-between items-center bg-brand-white p-2 rounded-lg">
                      <span>Monday - Thursday</span>
                      <b class="text-brand-black">10:00 AM - 10:00 PM</b>
                    </div>
                    <div class="flex justify-between items-center bg-brand-white p-2 rounded-lg">
                      <span>Friday - Saturday</span>
                      <b class="text-brand-black">10:00 AM - 11:30 PM</b>
                    </div>
                    <div class="flex justify-between items-center bg-brand-white p-2 rounded-lg">
                      <span>Sunday</span>
                      <b class="text-brand-black">11:00 AM - 9:00 PM</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: MENU BUILDER (Category selector, Pizza list, OCR upload) -->
          <div *ngIf="showsPanel('menu')" class="space-y-4 animate-fadeIn">
            <div class="flex justify-between items-center border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">🍕 Menu Builder</h3>
                <p class="text-xs text-brand-black mt-0.5">Configure your categories and visual items catalog.</p>
              </div>
              <button (click)="showManualAdd.set(!showManualAdd())"
                class="px-3.5 py-2 bg-brand-red text-brand-white hover:bg-brand-red text-brand-white font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5">
                ➕ Add Item
              </button>
            </div>

            <!-- Manual Item Form -->
            <div *ngIf="showManualAdd()" class="clay rounded-2xl p-5 border border-brand-black space-y-3 bg-brand-white animate-fadeIn">
              <h4 class="text-xs font-bold text-brand-black uppercase tracking-wider">Add Pizza or Side Item</h4>
              <div class="grid sm:grid-cols-4 gap-2 text-xs">
                <input type="text" [(ngModel)]="newItem.name" placeholder="Item name (e.g. Buffalo Chicken Pizza)"
                  class="bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red sm:col-span-2" />
                <input type="number" [(ngModel)]="newItem.basePrice" placeholder="Base Price $" min="0" step="0.01"
                  class="bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                <select [(ngModel)]="newItem.itemType"
                  class="bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red">
                  <option class="bg-brand-white" *ngFor="let t of itemTypes" [value]="t">{{ t }}</option>
                </select>
              </div>
              <div class="flex justify-end pt-1">
                <button (click)="addItem()" [disabled]="!newItem.name.trim() || savingItem()"
                  class="px-4 py-2 hover:hover:disabled:opacity-40 text-brand-black font-bold rounded-xl transition shadow-lg">
                  + Add Item
                </button>
              </div>
            </div>

            <!-- Categories Selector Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div *ngFor="let cat of menuCategories; let i = index" (click)="selectedMenuCategory.set(cat)"
                [class]="selectedMenuCategory() === cat 
                  ? 'p-4 rounded-xl border font-bold text-center cursor-pointer transition bg-brand-red text-brand-white border-brand-red text-brand-red' 
                  : 'p-4 rounded-xl border font-bold text-center cursor-pointer transition bg-brand-white border-brand-black text-brand-black hover:bg-brand-white hover:text-brand-black'">
                {{ cat }}
              </div>
            </div>

            <!-- Google Cloud Vision OCR Menu Import -->
            <div class="clay rounded-2xl p-5 border border-brand-black space-y-4 to-red-955/20">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-black pb-2">
                <div>
                  <h4 class="text-xs font-black text-brand-black uppercase tracking-wider flex items-center gap-1.5">
                    ✨ AI Menu Import (Cloud Vision OCR)
                  </h4>
                  <p class="text-[10px] text-brand-black">Upload a photo of your paper menu or sign. Our AI extracts items and pricing instantly.</p>
                </div>
              </div>

              <div class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-brand-black border-dashed rounded-2xl cursor-pointer bg-brand-white hover:bg-brand-white hover:border-brand-red transition">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <span class="text-3xl mb-2">📸</span>
                    <p class="text-xs font-bold text-brand-black">Select or Drag Menu Photo</p>
                    <p class="text-[10px] text-brand-black mt-0.5">Supports PNG, JPG, JPEG, WebP</p>
                  </div>
                  <input type="file" class="hidden" (change)="onMenuFileSelected($event)" accept="image/*" />
                </label>
              </div>

              <div *ngIf="processingOcr()" class="flex flex-col items-center justify-center py-4 space-y-2">
                <div class="animate-spin rounded-full h-7 w-7 border-t-2 border-brand-red"></div>
                <p class="text-[10px] text-brand-black font-bold animate-pulse">Running Cloud Vision OCR text extraction...</p>
              </div>

              <!-- OCR Suggestions Review Pane -->
              <div *ngIf="ocrSuggestions().length > 0" class="space-y-3 pt-2">
                <div class="flex items-center justify-between">
                  <h5 class="text-xs font-black text-brand-black">📋 Parsed Suggestions (Review &amp; Edit)</h5>
                  <button (click)="ocrSuggestions.set([])" class="text-[10px] text-brand-black hover:text-brand-black underline">Clear</button>
                </div>
                <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                  @for (s of ocrSuggestions(); track $index) {
                    <div class="clay-soft rounded-xl p-3 border border-brand-black flex items-center gap-3 bg-brand-white text-xs">
                      <input type="checkbox" [(ngModel)]="s.selected" class="w-4 h-4 accent-red-600 rounded cursor-pointer" />
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input type="text" [(ngModel)]="s.name" placeholder="Item Name"
                          class="bg-brand-white border border-brand-black rounded-lg px-2 py-1 text-brand-black text-xs outline-none focus:border-brand-red" />
                        <div class="flex items-center gap-1">
                          <span class="text-brand-black">$</span>
                          <input type="number" [(ngModel)]="s.basePrice" min="0" step="0.01"
                            class="w-full bg-brand-white border border-brand-black rounded-lg px-2 py-1 text-brand-black text-xs outline-none focus:border-brand-red" />
                        </div>
                        <select [(ngModel)]="s.itemType"
                          class="bg-brand-white border border-brand-black rounded-lg px-2 py-1 text-brand-black text-xs outline-none focus:border-brand-red">
                          <option class="bg-brand-white" *ngFor="let t of itemTypes" [value]="t">{{ t }}</option>
                        </select>
                      </div>
                    </div>
                  }
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button (click)="importSelectedOcrItems()" [disabled]="importingOcr()"
                    class="px-4 py-2.5 hover:hover:disabled:opacity-40 text-brand-black font-black text-xs rounded-xl transition shadow-lg shadow-red-500/10">
                    {{ importingOcr() ? 'Importing...' : 'Confirm & Import Selected Items' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Live Menu Items List -->
            <div *ngIf="loadingMenu()" class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
            </div>

            <div *ngIf="!loadingMenu() && filteredMenuItems().length === 0" class="text-center py-10 text-brand-black text-xs">
              No items found in category "{{ selectedMenuCategory() }}".
            </div>

            <div class="space-y-4">
              <div *ngFor="let item of filteredMenuItems()" class="bg-brand-white border border-brand-black p-4 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-brand-white rounded-lg flex items-center justify-center text-xl">🍕</div>
                  <div>
                    <p class="text-brand-black font-bold">{{ item.name }}</p>
                    <p class="text-xs text-brand-black">Base Price: {{ item.basePrice | currency }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button (click)="saveItem(item)"
                    class="text-xs font-bold text-brand-black hover:text-brand-black px-3 py-1 bg-brand-white hover:bg-brand-white rounded-lg transition">Save</button>
                  <button (click)="toggleAvailability(item)"
                    [class]="'text-xs font-bold px-3 py-1 rounded-lg transition ' + (item.available ? 'text-brand-green bg-green-500/10 hover:bg-green-500/20' : 'text-brand-red bg-brand-red text-brand-white hover:bg-brand-red text-brand-white')">
                    {{ item.available ? 'Active' : 'Disable' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: PRICE MANAGER (Quick item list base price editor) -->
          <div *ngIf="showsPanel('price')" class="space-y-4 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-brand-black">💰 Price Manager</h3>
              <p class="text-xs text-brand-black mt-0.5">Quickly edit all menu item prices on a single spreadsheet grid.</p>
            </div>

            <div class="clay-soft rounded-2xl border border-brand-black overflow-hidden">
              <table class="w-full text-xs text-left text-brand-black">
                <thead class="bg-brand-white text-[10px] uppercase font-black tracking-widest text-brand-black border-b border-brand-black">
                  <tr>
                    <th class="px-4 py-3">Item Name</th>
                    <th class="px-4 py-3">Category</th>
                    <th class="px-4 py-3">Current Price</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-brand-white">
                  <tr *ngFor="let item of menuItems()">
                    <td class="px-4 py-3 text-brand-black font-bold">{{ item.name }}</td>
                    <td class="px-4 py-3"><span class="bg-brand-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{{ item.itemType }}</span></td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1.5">
                        <span class="text-brand-black">$</span>
                        <input type="number" [(ngModel)]="item.basePrice" min="0" step="0.01"
                          class="w-24 bg-brand-white border border-brand-black rounded-lg px-2.5 py-1 text-brand-black text-xs outline-none focus:border-brand-red" />
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button (click)="saveItem(item)"
                        class="bg-brand-red text-brand-white hover:bg-brand-red text-brand-white font-bold px-3 py-1.5 rounded-lg transition text-[10px]">
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
            <div class="flex justify-between items-center border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">📦 Live Orders Board</h3>
                <p class="text-xs text-brand-black mt-0.5">Drag-like pipeline for processing new, active, and ready orders.</p>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest text-brand-green font-bold text-brand-green px-2 py-1 rounded-md border border-brand-green">LIVE RADAR</span>
            </div>

            <!-- Status sub-tabs -->
            <div class="flex gap-1 bg-brand-white p-1 rounded-xl w-fit overflow-x-auto scrollbar-none">
              @for (st of orderStatusTabs; track st.id) {
                <button (click)="orderStatusTab.set(st.id)"
                  [class]="'px-3 py-1.5 rounded-lg text-[11px] font-black transition whitespace-nowrap ' + (orderStatusTab() === st.id ? 'bg-brand-red text-brand-white' : 'text-brand-black hover:text-brand-black')">{{ st.label }}</button>
              }
            </div>

            <!-- Active pipeline (Kanban) -->
            <div *ngIf="orderStatusTab() === 'active'" class="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <!-- Kanban columns -->
              <div *ngFor="let col of kanbanColumns" class="bg-brand-white border border-brand-black rounded-2xl flex flex-col overflow-hidden h-[600px]">
                <div class="p-4 border-b border-brand-black bg-brand-white flex justify-between items-center">
                  <h3 [class]="col.color" class="font-black text-xs uppercase tracking-wider">{{ col.title }}</h3>
                  <span class="bg-brand-white px-2 py-0.5 rounded-full text-xs font-bold text-brand-black">{{ col.items.length }}</span>
                </div>
                <div class="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none cursor-pointer">
                  <div *ngFor="let order of col.items" [class]="'bg-brand-white border ' + col.border + ' rounded-xl p-4 hover:bg-brand-white transition-colors'">
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-xs font-bold text-brand-black">#{{ order.id.slice(-4).toUpperCase() }}</span>
                      <span class="text-xs font-black text-brand-green">{{ order.total | currency }}</span>
                    </div>
                    <div class="text-xs text-brand-black space-y-1 mb-3">
                      <div *ngFor="let item of order.items">
                        <b class="text-brand-black">{{ item.quantity }}x</b> {{ item.itemName }}
                      </div>
                    </div>
                    
                    <select [value]="order.status.toLowerCase()" 
                      (change)="onOrderStatusDropdownChange(order.id, order.status, $event)"
                      class="w-full bg-brand-white border border-brand-black text-xs font-bold text-brand-black rounded-lg p-2 focus:outline-none focus:border-brand-red capitalize">
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
              <div *ngFor="let o of ordersByStatus()" class="clay rounded-xl p-3 border border-brand-black flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="font-bold text-brand-black">#{{ o.orderNumber }}</span>
                <span [class]="getStatusClass(o.status)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{{ o.status }}</span>
                <span class="text-brand-black">{{ o.placedAt | date:'MMM d, h:mm a' }}</span>
                <span class="font-black text-brand-black">{{ o.total | currency }}</span>
              </div>
              <p *ngIf="ordersByStatus().length === 0" class="text-xs text-brand-black text-center py-8">No {{ orderStatusTab() }} orders.</p>
            </div>
          </div>

          <!-- TAB 6: RECEIPTS (Completed Transactions History list) -->
          <div *ngIf="showsPanel('receipts')" class="space-y-4 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-brand-black">🧾 Order Receipts History</h3>
              <p class="text-xs text-brand-black mt-0.5">Monitor and export all completed receipt parameters for auditing.</p>
            </div>

            <div class="clay-soft rounded-2xl border border-brand-black overflow-hidden">
              <table class="w-full text-xs text-left text-brand-black">
                <thead class="bg-brand-white text-[10px] uppercase font-black tracking-widest text-brand-black border-b border-brand-black">
                  <tr>
                    <th class="px-4 py-3">Receipt ID</th>
                    <th class="px-4 py-3">Customer Email</th>
                    <th class="px-4 py-3">Discharge Date</th>
                    <th class="px-4 py-3">Net Payment</th>
                    <th class="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-brand-white">
                  <tr *ngFor="let order of completedOrdersList()">
                    <td class="px-4 py-3 font-mono text-[10px] text-brand-black font-bold">REC-{{ order.id.slice(-6).toUpperCase() }}</td>
                    <td class="px-4 py-3">{{ 'customer@mislice.com' }}</td>
                    <td class="px-4 py-3">{{ order.placedAt | date:'medium' }}</td>
                    <td class="px-4 py-3 text-brand-green font-bold">{{ order.total | currency }}</td>
                    <td class="px-4 py-3 text-brand-green">Paid</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 7: PAYMENTS & PAYOUTS -->
          <div *ngIf="showsPanel('payouts')" class="space-y-6 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">💳 Payments &amp; Payouts</h3>
                <p class="text-xs text-brand-black mt-0.5">Disburse weekly store earnings minus the platform commission.</p>
              </div>
              <button (click)="requestPayout()" [disabled]="netEarnings() <= 0"
                class="px-4 py-2 hover:hover:disabled:opacity-40 text-brand-black font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/10">
                Request Instant Payout 💰
              </button>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div class="clay p-5 rounded-2xl border border-brand-black bg-brand-white">
                <p class="text-brand-black text-[10px] font-black uppercase tracking-wider">Connected Bank Destination</p>
                <p class="text-base font-black text-brand-black mt-1">Chase Bank Business Account</p>
                <p class="text-xs text-brand-black mt-0.5">Routing: *******9821 • Status: 🟢 ACTIVE</p>
              </div>
              <div class="clay p-5 rounded-2xl border border-brand-black bg-brand-white">
                <p class="text-brand-black text-[10px] font-black uppercase tracking-wider">Pending Payout Balance</p>
                <p class="text-2xl font-black text-brand-black mt-0.5">{{ netEarnings() | currency }}</p>
                <p class="text-[9px] text-brand-black mt-0.5">Payout threshold: $50.00 global limit</p>
              </div>
            </div>

            <!-- Payout Logs Table -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-brand-black uppercase tracking-wider">Payout History Log</h4>
              <div class="clay-soft rounded-2xl border border-brand-black overflow-hidden">
                <table class="w-full text-xs text-left text-brand-black">
                  <thead class="bg-brand-white text-[10px] uppercase font-black tracking-widest text-brand-black border-b border-brand-black">
                    <tr>
                      <th class="px-4 py-3">Payout ID</th>
                      <th class="px-4 py-3">Transfer Date</th>
                      <th class="px-4 py-3">Amount</th>
                      <th class="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 bg-brand-white">
                    <tr *ngFor="let p of payoutHistory">
                      <td class="px-4 py-3 font-mono text-[10px]">{{ p.id }}</td>
                      <td class="px-4 py-3">{{ p.createdAt | date }}</td>
                      <td class="px-4 py-3 text-brand-black font-bold">{{ p.netPayout | currency }}</td>
                      <td class="px-4 py-3 text-brand-green font-bold">✓ {{ p.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 8: DEALS & COUPONS (Quick campaign setup) -->
          <div *ngIf="showsPanel('deals')" class="space-y-4 animate-fadeIn">
            <div class="flex justify-between items-center border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">🏷️ Deals &amp; Offers</h3>
                <p class="text-xs text-brand-black mt-0.5">Publish special discount rates and campaign specials visible on the comparison board.</p>
              </div>
              <button (click)="showManualDeal.set(!showManualDeal())"
                class="px-3.5 py-2 bg-brand-red text-brand-white hover:bg-brand-red text-brand-white font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5">
                ➕ Create Deal
              </button>
            </div>

            <!-- Quick Template Deals Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div *ngFor="let type of ['20% Off', 'Buy One Get One', 'Free Delivery']" (click)="applyQuickAction(type)"
                class="bg-brand-white border border-brand-black p-6 rounded-2xl text-center hover:border-brand-red cursor-pointer transition-all">
                <div class="w-12 h-12 bg-brand-red text-brand-white text-brand-red rounded-full flex items-center justify-center mx-auto mb-3">➕</div>
                <p class="text-brand-black font-bold text-sm">{{ type }}</p>
              </div>
            </div>

            <!-- Custom Deal Form -->
            <div *ngIf="showManualDeal()" class="clay rounded-2xl p-5 border border-brand-black space-y-3 bg-brand-white animate-fadeIn">
              <h4 class="text-xs font-bold text-brand-black uppercase tracking-wider">Create Custom Promo / Coupon</h4>
              <div class="space-y-3 text-xs">
                <div>
                  <label class="block text-[10px] text-brand-black mb-1 font-bold">Deal Title</label>
                  <input type="text" [(ngModel)]="newDeal.title" placeholder="Double Play: 2 Mediums for $19.99"
                    class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                </div>
                <div>
                  <label class="block text-[10px] text-brand-black mb-1 font-bold">Description</label>
                  <input type="text" [(ngModel)]="newDeal.description" placeholder="Include toppings limit or size details"
                    class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1 font-bold">Original Price ($)</label>
                    <input type="number" [(ngModel)]="newDeal.originalPrice" placeholder="24.99" min="0" step="0.01"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-brand-black mb-1 font-bold">Sale / Deal Price ($)</label>
                    <input type="number" [(ngModel)]="newDeal.discountedPrice" placeholder="19.99" min="0" step="0.01"
                      class="w-full bg-brand-white border border-brand-black rounded-lg px-3 py-2 text-brand-black outline-none focus:border-brand-red" />
                  </div>
                </div>
                <button (click)="addDeal()" [disabled]="!newDeal.title.trim() || savingDeal()"
                  class="w-full py-3 hover:hover:disabled:opacity-40 text-brand-black font-black rounded-xl transition shadow-lg mt-2 text-xs">
                  Publish Campaign 🏷️
                </button>
              </div>
            </div>

            <!-- Active Deals List -->
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-brand-black mb-4">Active Coupons</h3>
              <div *ngIf="loadingDeals()" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-red"></div>
              </div>
              <div *ngIf="!loadingDeals() && deals().length === 0" class="text-center py-8 text-brand-black text-xs">
                No active deals found.
              </div>
              <div *ngFor="let deal of deals()" class="clay rounded-xl p-4 border border-brand-black flex justify-between items-center text-xs bg-brand-white">
                <div>
                  <p class="text-brand-black font-bold text-sm">{{ deal.title }}</p>
                  <p class="text-xs font-bold text-brand-green mt-1">
                    {{ deal.discountedPrice | currency }}
                    <span class="text-brand-black line-through font-normal ml-1" *ngIf="deal.originalPrice">{{ deal.originalPrice | currency }}</span>
                  </p>
                </div>
                <button (click)="toggleDeal(deal)"
                  [class]="'text-xs font-bold px-3 py-1 bg-brand-white hover:bg-brand-white rounded-lg transition ' + (deal.active ? 'text-brand-green' : 'text-brand-red')">
                  {{ deal.active ? 'Disable' : 'Enable' }}
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 9: ANALYTICS -->
          <div *ngIf="showsPanel('analytics')" class="space-y-6 animate-fadeIn">
            <div>
              <h3 class="text-lg font-black text-brand-black">📊 Analytics</h3>
              <p class="text-xs text-brand-black mt-0.5">Detailed metrics regarding average order value, conversion rates, and item performance.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Top Selling Pizzas -->
              <div class="bg-brand-white backdrop-blur-2xl border border-brand-black p-6 rounded-3xl">
                <h3 class="text-sm font-bold text-brand-black uppercase tracking-widest mb-4">Top Selling Pizzas</h3>
                <div class="space-y-4 text-xs">
                  <div *ngFor="let pizza of topSellingPizzas">
                    <div class="flex justify-between font-bold text-brand-black mb-1">
                      <span>{{ pizza.name }}</span>
                      <span>{{ pizza.pct }}%</span>
                    </div>
                    <div class="w-full bg-brand-white h-2 rounded-full overflow-hidden">
                      <div class="bg-brand-red text-brand-white h-full rounded-full" [style.width.%]="pizza.pct"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery vs Pickup donut chart -->
              <div class="bg-brand-white backdrop-blur-2xl border border-brand-black p-6 rounded-3xl flex flex-col items-center justify-center">
                <h3 class="text-sm font-bold text-brand-black uppercase tracking-widest mb-4 w-full text-left">Delivery vs Pickup</h3>
                <div class="w-32 h-32 rounded-full border-[14px] border-brand-red border-r-blue-500 relative flex items-center justify-center">
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-xl font-black text-brand-black">
                    <span>65%</span>
                    <span class="text-[8px] uppercase tracking-widest text-brand-black">Delivery</span>
                  </div>
                </div>
                <div class="flex justify-center gap-6 mt-6 text-xs font-bold">
                  <span class="flex items-center gap-2 text-brand-black"><div class="w-3 h-3 bg-brand-red text-brand-white rounded-sm"></div> Delivery</span>
                  <span class="flex items-center gap-2 text-brand-black"><div class="w-3 h-3 bg-blue-500 rounded-sm"></div> Pickup</span>
                </div>
              </div>
            </div>
          </div>

          <!-- USERS / STAFF MANAGEMENT -->
          <div *ngIf="showsPanel('users')" class="space-y-5 animate-fadeIn">
            <div class="border-b border-brand-black pb-3">
              <h3 class="text-lg font-black text-brand-black">👥 Users &amp; Staff</h3>
              <p class="text-xs text-brand-black mt-0.5">Invite team members and manage who can access this store.</p>
            </div>

            <!-- Add user -->
            <div class="clay rounded-2xl p-4 border border-brand-black">
              <p class="text-xs font-black uppercase tracking-widest text-brand-black mb-3">Add a user</p>
              <div class="grid sm:grid-cols-[1fr_1fr_130px_auto] gap-2">
                <input [(ngModel)]="newUser.name" placeholder="Full name" class="bg-brand-white border border-brand-black rounded-xl px-3 py-2 text-brand-black text-xs outline-none focus:border-brand-red" />
                <input [(ngModel)]="newUser.email" placeholder="Email" class="bg-brand-white border border-brand-black rounded-xl px-3 py-2 text-brand-black text-xs outline-none focus:border-brand-red" />
                <select [(ngModel)]="newUser.role" class="bg-brand-white border border-brand-black rounded-xl px-3 py-2 text-brand-black text-xs outline-none focus:border-brand-red">
                  <option class="bg-brand-white" *ngFor="let r of staffRoles" [value]="r">{{ r }}</option>
                </select>
                <button (click)="addUser()" [disabled]="!newUser.name.trim() || !newUser.email.trim()" class="px-4 py-2 bg-brand-red text-brand-white hover:bg-brand-red text-brand-white disabled:opacity-40 text-brand-black text-xs font-black rounded-xl transition whitespace-nowrap">+ Invite</button>
              </div>
            </div>

            <!-- Manage users -->
            <div class="space-y-2">
              <div *ngFor="let u of staff()" class="clay rounded-xl p-3 border border-brand-black flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-brand-white flex items-center justify-center text-sm font-black text-brand-red">{{ u.name.substring(0,1).toUpperCase() }}</div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-brand-black truncate">{{ u.name }} <span class="text-[9px] font-black uppercase tracking-wider bg-brand-white text-brand-black px-1.5 py-0.5 rounded ml-1">{{ u.role }}</span></p>
                    <p class="text-[10px] text-brand-black truncate">{{ u.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span [class]="'text-[9px] font-black uppercase px-2 py-1 rounded-full ' + (u.status === 'Active' ? 'text-brand-green font-bold text-brand-green' : 'text-brand-orange font-bold text-brand-orange')">{{ u.status }}</span>
                  <button *ngIf="u.role !== 'Owner'" (click)="removeUser(u)" class="text-[10px] font-bold text-brand-red hover:text-brand-red">Remove</button>
                </div>
              </div>
              <p *ngIf="staff().length === 0" class="text-xs text-brand-black text-center py-6">No team members yet. Invite your first one above.</p>
            </div>
          </div>

          <!-- DELIVERY -->
          <div *ngIf="showsPanel('delivery')" class="space-y-5 animate-fadeIn">
            <div class="border-b border-brand-black pb-3">
              <h3 class="text-lg font-black text-brand-black">🛵 Delivery</h3>
              <p class="text-xs text-brand-black mt-0.5">Delivery settings and orders currently on the road.</p>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
              <div class="clay rounded-2xl p-4 border border-brand-black">
                <p class="text-[10px] font-black uppercase tracking-widest text-brand-black">Delivery Radius</p>
                <input type="number" [(ngModel)]="selectedShop()!.deliveryRadiusMiles" class="w-full bg-transparent text-2xl font-black text-brand-black outline-none mt-1" /> <span class="text-xs text-brand-black">miles</span>
              </div>
              <div class="clay rounded-2xl p-4 border border-brand-black">
                <p class="text-[10px] font-black uppercase tracking-widest text-brand-black">Delivery Fee</p>
                <div class="flex items-baseline gap-1 mt-1"><span class="text-brand-black">$</span><input type="number" [(ngModel)]="selectedShop()!.deliveryFee" class="w-full bg-transparent text-2xl font-black text-brand-black outline-none" /></div>
              </div>
              <div class="clay rounded-2xl p-4 border border-brand-black flex flex-col justify-between">
                <p class="text-[10px] font-black uppercase tracking-widest text-brand-black">Avg Delivery ETA</p>
                <p class="text-2xl font-black text-brand-black mt-1">{{ selectedShop()?.averageEtaMinutes || 30 }} <span class="text-xs text-brand-black">min</span></p>
              </div>
            </div>
            <button (click)="saveSettings()" class="px-4 py-2.5 bg-brand-red text-brand-white hover:bg-brand-red text-brand-white text-xs font-black rounded-xl transition">Save Delivery Settings</button>

            <div class="pt-2">
              <p class="text-xs font-black uppercase tracking-widest text-brand-black mb-2">Out for delivery ({{ outForDeliveryOrders().length }})</p>
              <div class="space-y-2">
                <div *ngFor="let o of outForDeliveryOrders()" class="clay rounded-xl p-3 border border-brand-black flex items-center justify-between text-xs">
                  <span class="font-bold text-brand-black">#{{ o.orderNumber }}</span>
                  <span class="text-brand-black">{{ o.total | currency }}</span>
                  <button (click)="updateStatus(o.id, 'DELIVERED')" class="text-[10px] font-bold text-brand-green hover:text-brand-green">Mark Delivered</button>
                </div>
                <p *ngIf="outForDeliveryOrders().length === 0" class="text-xs text-brand-black text-center py-4">No active deliveries right now.</p>
              </div>
            </div>
          </div>

          <!-- AI INSIGHTS -->
          <div *ngIf="showsPanel('insights')" class="space-y-4 animate-fadeIn">
            <div class="border-b border-brand-black pb-3">
              <h3 class="text-lg font-black text-brand-black">🤖 AI Insights</h3>
              <p class="text-xs text-brand-black mt-0.5">Smart suggestions generated from your store's activity.</p>
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div *ngFor="let ins of aiInsights()" class="clay rounded-2xl p-4 border border-brand-black">
                <p class="text-2xl">{{ ins.icon }}</p>
                <p class="text-sm font-black text-brand-black mt-2">{{ ins.title }}</p>
                <p class="text-xs text-brand-black mt-1 leading-relaxed">{{ ins.body }}</p>
              </div>
            </div>
          </div>

          <!-- REVIEWS -->
          <div *ngIf="showsPanel('reviews')" class="space-y-5 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-brand-black pb-3">
              <div>
                <h3 class="text-lg font-black text-brand-black">⭐ Customer Reviews</h3>
                <p class="text-xs text-brand-black mt-0.5">See what customers say — and reply to build trust.</p>
              </div>
              <div class="flex gap-1 bg-brand-white p-1 rounded-xl">
                <button *ngFor="let f of reviewFilters" (click)="reviewFilter.set(f)"
                  [class]="'px-3 py-1 rounded-lg text-[10px] font-black capitalize ' + (reviewFilter() === f ? 'bg-brand-red text-brand-white' : 'text-brand-black hover:text-brand-black')">{{ f }}</button>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <div class="text-center shrink-0">
                <p class="text-4xl font-black text-brand-black leading-none">{{ avgRating() | number:'1.1-1' }}</p>
                <p class="text-sm text-brand-orange mt-1">{{ starStr(avgRating()) }}</p>
                <p class="text-[10px] text-brand-black mt-1">{{ reviews().length }} review{{ reviews().length === 1 ? '' : 's' }}</p>
              </div>
            </div>

            <div *ngIf="loadingReviews()" class="flex justify-center py-8"><div class="animate-spin rounded-full h-7 w-7 border-t-2 border-brand-red"></div></div>
            <div *ngIf="!loadingReviews() && reviews().length === 0" class="text-center py-10 text-brand-black text-xs">
              No reviews yet. They'll appear here as customers rate their orders.
            </div>

            <div class="space-y-3">
              <div *ngFor="let r of filteredReviews()" class="clay rounded-2xl p-4 border border-brand-black">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-bold text-brand-black">{{ r.userFullName }}</span>
                  <span class="text-brand-orange text-xs">{{ starStr(r.rating) }}</span>
                </div>
                <p class="text-xs text-brand-black mt-1.5 leading-relaxed">{{ r.comment }}</p>
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-brand-black">
                  <span class="text-[10px] text-brand-black">{{ r.createdAt | date:'mediumDate' }}</span>
                  <button class="text-[10px] font-black text-brand-red hover:text-brand-red">↩ Reply</button>
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
  private readonly payoutService = inject(PayoutService);
  private readonly alertsService = inject(MerchantAlertsService);
  private readonly alerts = inject(MerchantAlertsService);
  private readonly route = inject(ActivatedRoute);

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

  payoutHistory: PayoutDto[] = [];



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
    { title: 'Ready / Out', color: 'text-brand-green', border: 'border-green-500/30', items: [] as OrderDto[] },
    { title: 'Completed', color: 'text-brand-black', border: 'border-brand-black', items: [] as OrderDto[] }
  ];

  ngOnInit() {
    // Active section is driven by the ?tab= URL param set by the app sidebar.
    this.route.queryParamMap.subscribe(p => this.activeTab.set(p.get('tab') || 'dashboard'));
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
    this.loadPayouts();
    this.loadStaff();
  }

  loadPayouts() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.payoutService.getPayouts(shop.id).subscribe({
      next: (data) => this.payoutHistory = data
    });
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
  loadStaff() {
    const shop = this.selectedShop();
    if (!shop) return;
    this.restaurantService.getStaff(shop.id).subscribe({
      next: (data) => {
        const parsed = data.map((d: any) => ({
          id: d.id, name: d.name, email: d.email, role: d.role, status: d.status, joinedAt: d.joinedAt
        }));
        this.staff.set(parsed);
      }
    });
  }

  addUser() {
    const name = this.newUser.name.trim(), email = this.newUser.email.trim();
    if (!name || !email) return;
    const shop = this.selectedShop();
    if (!shop) return;
    this.restaurantService.inviteStaff(shop.id, email).subscribe({
      next: () => {
        this.staff.update(list => [...list, { id: Date.now().toString(), name, email, role: this.newUser.role as any, status: 'Active', joinedAt: new Date().toISOString() }]);
        this.newUser = { name: '', email: '', role: 'Manager' };
        this.successMsg.set(`User ${email} invited successfully.`);
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        console.error('Failed to invite user', err);
        // Fallback for demo just adding it locally if user doesn't exist
        this.staff.update(list => [...list, { id: Date.now().toString(), name, email, role: this.newUser.role as any, status: 'Pending', joinedAt: new Date().toISOString() }]);
        this.newUser = { name: '', email: '', role: 'Manager' };
      }
    });
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
  // Real-data merchant alerts (shown in the top-nav bell). No mock data.
  notifications = computed<MerchantAlert[]>(() => {
    const out: MerchantAlert[] = [];
    const pending = this.orders().filter(o => ['PENDING', 'PLACED'].includes(o.status?.toUpperCase()));
    if (pending.length) out.push({ id: 'pending-orders', type: 'Orders', icon: '⚠️', title: `${pending.length} order(s) waiting for acceptance`, detail: 'Accept and start preparing in Orders.' });
    if (!this.online()) out.push({ id: 'store-closed', type: 'System', icon: '🔴', title: 'Your store is currently closed', detail: 'Toggle Accepting Orders to receive orders again.' });
    const revenue = this.orders().reduce((s, o) => s + (Number(o.total) || 0), 0);
    if (revenue > 0) out.push({ id: 'payout', type: 'Payments', icon: '💳', title: `${this.formatMoney(revenue * 0.8)} in net earnings`, detail: 'View your balance and payouts in Financials.' });
    const lowReviews = this.reviews().filter(r => r.rating <= 2);
    if (lowReviews.length) out.push({ id: 'low-reviews', type: 'System', icon: '💬', title: `${lowReviews.length} low rating(s) to review`, detail: 'Reply to customers in Reviews.' });
    if (!this.deals().length) out.push({ id: 'no-deals', type: 'Deals', icon: '🏷️', title: 'No active deals', detail: 'Create a promotion to attract customers.' });
    const oos = this.menuItems().filter(i => !i.available);
    if (oos.length) out.push({ id: 'oos', type: 'Menu Updates', icon: '🍕', title: `${oos.length} item(s) out of stock`, detail: 'Update availability in Menu.' });
    return out;
  });

  private readonly _syncAlerts = effect(() => this.alerts.setAlerts(this.notifications()));

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
        color: 'text-brand-green', 
        border: 'border-green-500/30', 
        items: list.filter(o => ['ready_for_pickup', 'out_for_delivery', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)) 
      },
      { 
        title: 'Completed', 
        color: 'text-brand-black', 
        border: 'border-brand-black', 
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
    const updateObs = item.id
      ? this.menuService.updatePrice(shop.id, item.id, item.basePrice)
      : this.menuService.saveMenuItem(shop.id, item);
    updateObs.subscribe({
      next: (updated) => {
        this.successMsg.set('✅ Price updated successfully');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.savingItem.set(false);
        if (item.id) {
          this.menuItems.update(list => list.map(i => i.id === updated.id ? updated : i));
        }
      },
      error: (err) => {
        this.successMsg.set('❌ Failed to update price');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.savingItem.set(false);
      }
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
    this.addUser();
  }

  requestPayout(): void {
    const earnings = this.netEarnings();
    if (earnings <= 0) return;
    
    this.successMsg.set('');
    const shop = this.selectedShop();
    if (!shop) return;

    this.payoutService.requestPayout(shop.id, earnings).subscribe({
      next: (payout) => {
        this.payoutHistory.unshift(payout);
        this.successMsg.set(`Instant payout request of ${earnings.toFixed(2)} approved & initiated successfully!`);
        setTimeout(() => this.successMsg.set(''), 5000);
      },
      error: (err) => {
        console.error('Failed to request payout', err);
      }
    });
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
      case 'DELIVERED': return 'bg-green-500/20 text-brand-green border border-green-500/30';
      case 'CANCELLED': return 'bg-brand-red text-brand-white text-brand-red border border-brand-red';
      case 'PREPARING': return 'text-brand-orange font-bold text-brand-orange border border-yellow-500/30';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-brand-white text-brand-black border border-brand-black';
    }
  }
}
