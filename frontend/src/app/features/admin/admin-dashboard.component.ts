import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { Store, OrderDto, MenuItem, Deal } from '../../shared/models';

interface PlatformCoupon { code: string; discount: number; active: boolean; }
interface Payout { id: string; storeName: string; amount: number; status: string; date: string; }
interface PlatformOrder { id: string; storeName: string; userEmail: string; total: number; status: string; }

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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="w-full min-h-screen bg-[#080808] text-white">
      
      <!-- LOADING STATE -->
      <div *ngIf="loading()" class="p-20 text-center flex items-center justify-center min-h-screen bg-[#080808]">
        <div class="flex flex-col items-center gap-3">
          <div class="animate-spin rounded-full h-9 w-9 border-t-2 border-red-600"></div>
          <p class="text-xs text-white/40 font-bold">Synchronizing dashboard workspace...</p>
        </div>
      </div>

      <div *ngIf="!loading()" class="max-w-7xl mx-auto py-6 px-4 space-y-6">

        <!-- ========================================== -->
        <!-- 1. PLATFORM ADMIN DASHBOARD VIEW         -->
        <!-- ========================================== -->
        <div *ngIf="isPlatformAdmin()" class="space-y-6 animate-fadeIn">
          <!-- HEADER -->
          <div class="glass rounded-[2rem] p-6 border border-white/10 flex items-center gap-3 bg-gradient-to-r from-neutral-900/90 to-red-950/20 shadow-xl">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xl shadow-lg">🛡️</div>
            <div>
              <h2 class="text-2xl font-black tracking-tight text-white">Platform Administration</h2>
              <p class="text-xs text-white/50 font-medium">Approve partners, monitor operations, and manage the marketplace.</p>
            </div>
          </div>

          <!-- SUCCESS ALERT -->
          <div *ngIf="successMsg()" class="glass border border-emerald-500/35 bg-emerald-500/10 rounded-2xl p-4 text-center text-emerald-400 font-bold text-sm animate-fadeIn">
            ✅ {{ successMsg() }}
          </div>

          <!-- MAIN TABS LAYOUT -->
          <div class="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
            <!-- Sidebar Navigation -->
            <div class="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none shrink-0">
              @for (tab of adminTabs; track tab.id) {
                <button (click)="activeAdminTab.set(tab.id)"
                  [class]="'glare-hover text-left px-4 py-3 rounded-2xl text-xs font-black transition whitespace-nowrap min-w-[140px] lg:min-w-0 flex items-center gap-3 ' +
                    (activeAdminTab() === tab.id
                      ? 'bg-gradient-to-r from-red-700/80 to-red-600/50 text-white border border-red-500/30'
                      : 'text-white/60 hover:text-white')">
                  <span>{{ tab.icon }}</span>
                  {{ tab.name }}
                  <span *ngIf="tab.id === 'restaurants' && pendingCount() > 0"
                    class="ml-auto w-5 h-5 rounded-full bg-yellow-500 text-black text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {{ pendingCount() }}
                  </span>
                </button>
              }
            </div>

            <!-- Content Card -->
            <div class="glass rounded-[2rem] p-6 min-h-[500px] border border-white/10 bg-black/35 shadow-2xl">
              
              <!-- ADMIN TAB: OVERVIEW -->
              <div *ngIf="activeAdminTab() === 'overview'" class="space-y-6 animate-fadeIn">
                <h3 class="text-lg font-black text-white">📊 Platform Overview</h3>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div class="glass rounded-xl p-4 border border-white/5 bg-white/5">
                    <span class="text-base">🏪</span>
                    <p class="text-xl font-black text-white mt-1">{{ activeCount() }}</p>
                    <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Active Stores</p>
                  </div>
                  <div class="glass rounded-xl p-4 border border-white/5 bg-white/5">
                    <span class="text-base">⏳</span>
                    <p class="text-xl font-black text-white mt-1">{{ pendingCount() }}</p>
                    <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Pending Review</p>
                  </div>
                  <div class="glass rounded-xl p-4 border border-white/5 bg-white/5">
                    <span class="text-base">💰</span>
                    <p class="text-xl font-black text-white mt-1">{{ totalRevenue() | currency }}</p>
                    <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Gross GMV</p>
                  </div>
                  <div class="glass rounded-xl p-4 border border-white/5 bg-white/5">
                    <span class="text-base">🛡️</span>
                    <p class="text-xl font-black text-white mt-1">20%</p>
                    <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Platform Fee</p>
                  </div>
                </div>

                <div class="glass-soft rounded-2xl p-5 border border-white/5 space-y-4 bg-black/10">
                  <h4 class="text-xs font-black uppercase text-white/50 tracking-wider">📈 Michigan Sales Distribution</h4>
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span>Detroit Metro</span>
                        <span class="text-white/60 font-bold">65%</span>
                      </div>
                      <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div class="bg-red-500 h-full rounded-full" style="width: 65%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span>Ann Arbor</span>
                        <span class="text-white/60 font-bold">25%</span>
                      </div>
                      <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div class="bg-orange-500 h-full rounded-full" style="width: 25%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ADMIN TAB: PARTNER AUDIT -->
              <div *ngIf="activeAdminTab() === 'restaurants'" class="space-y-4 animate-fadeIn">
                <div class="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 class="text-lg font-black text-white">🏪 Restaurant Listings</h3>
                  <div class="flex gap-1 bg-white/5 p-1 rounded-xl">
                    <button *ngFor="let sTab of ['all', 'pending', 'approved']" (click)="selectedStatusTab.set(sTab)"
                      [class]="'px-3 py-1 rounded-lg text-[10px] font-black capitalize ' + (selectedStatusTab() === sTab ? 'bg-red-600 text-white shadow-sm' : 'text-white/50 hover:text-white')">
                      {{ sTab }}
                    </button>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="border-b border-white/10 bg-white/5">
                        <th class="p-4 font-bold text-white/50">Restaurant Name</th>
                        <th class="p-4 font-bold text-white/50">Location</th>
                        <th class="p-4 font-bold text-white/50">Email</th>
                        <th class="p-4 font-bold text-white/50">Status</th>
                        <th class="p-4 font-bold text-white/50 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let shop of filteredRestaurants()" class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="p-4 font-bold text-white text-sm">{{ shop.name }}</td>
                        <td class="p-4 text-white/70">{{ shop.addressLine }}, {{ shop.city }}</td>
                        <td class="p-4 text-white/50">{{ shop.email || 'partner@mislice.com' }}</td>
                        <td class="p-4">
                          <span [class]="shop.approved ? 'bg-green-500/20 text-green-400 border border-green-500/25' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/25'"
                            class="px-2.5 py-1 rounded-full font-black uppercase tracking-wider text-[9px]">
                            {{ shop.approved ? 'Approved' : 'Pending Review' }}
                          </span>
                        </td>
                        <td class="p-4 text-right space-x-2">
                          <button *ngIf="!shop.approved" (click)="approve(shop.id)"
                            class="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                            Approve
                          </button>
                          <button (click)="reject(shop.id)"
                            class="bg-red-600/25 border border-red-500/30 hover:bg-red-600 text-red-300 hover:text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                            Delete
                          </button>
                        </td>
                      </tr>
                      <tr *ngIf="filteredRestaurants().length === 0">
                        <td colspan="5" class="p-8 text-center text-white/40">No restaurants match this section.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ADMIN TAB: GLOBAL ORDERS -->
              <div *ngIf="activeAdminTab() === 'orders'" class="space-y-4 animate-fadeIn">
                <h3 class="text-lg font-black text-white">📦 Global Orders Feed</h3>
                <p class="text-xs text-white/50">Live feed of all transactions happening across Michigan on the MiSlice platform.</p>
                <div class="space-y-2.5 pt-2">
                  <div *ngFor="let order of platformOrders()" class="glass rounded-xl p-4 border border-white/5 flex items-center justify-between text-xs bg-white/5">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-black text-white">Order #{{ order.id }}</span>
                        <span class="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                          {{ order.status }}
                        </span>
                      </div>
                      <p class="text-[10px] text-white/40 mt-1">To: {{ order.userEmail }} · Store: {{ order.storeName }}</p>
                    </div>
                    <span class="font-black text-white text-sm">{{ order.total | currency }}</span>
                  </div>
                </div>
              </div>

              <!-- ADMIN TAB: PAYOUTS MANAGER -->
              <div *ngIf="activeAdminTab() === 'payouts'" class="space-y-4 animate-fadeIn">
                <h3 class="text-lg font-black text-white">💰 Restaurant Payouts</h3>
                <p class="text-xs text-white/50">Disburse weekly store earnings minus the platform commission.</p>
                <div class="space-y-2 pt-2">
                  <div *ngFor="let p of payouts()" class="glass rounded-xl p-4 border border-white/5 flex justify-between items-center text-xs bg-white/5">
                    <div>
                      <h4 class="font-bold text-white">{{ p.storeName }}</h4>
                      <p class="text-[10px] text-white/40 mt-1">Net disbursement due: {{ p.amount | currency }} · Date: {{ p.date }}</p>
                    </div>
                    <div class="flex items-center gap-3">
                      <span [class]="p.status === 'PAID' ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'"
                        class="px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider">
                        {{ p.status }}
                      </span>
                      <button *ngIf="p.status === 'PENDING'" (click)="markPaid(p.id)"
                        class="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px]">
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ADMIN TAB: PLATFORM COUPONS -->
              <div *ngIf="activeAdminTab() === 'coupons'" class="space-y-4 animate-fadeIn">
                <h3 class="text-lg font-black text-white">🎟️ Platform Discount Codes</h3>
                <p class="text-xs text-white/50">Manage platform-wide marketing coupons (discounts applied at checkout).</p>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div class="glass rounded-2xl p-4 border border-white/5 space-y-3 bg-white/5">
                    <h4 class="text-xs font-bold text-white/50 uppercase">Create Platform Coupon</h4>
                    <div class="space-y-2 text-xs">
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Coupon Code</label>
                        <input type="text" [(ngModel)]="newCode" placeholder="e.g. DETROITFREE"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Discount amount ($)</label>
                        <input type="number" [(ngModel)]="newDiscount" placeholder="5"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                      <button (click)="createCoupon()"
                        class="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-lg transition shadow-lg">
                        Create Coupon Code
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div *ngFor="let coupon of coupons()" class="glass rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs bg-white/5">
                      <div>
                        <span class="font-black text-white bg-white/5 px-2 py-0.5 rounded">{{ coupon.code }}</span>
                        <p class="text-[10px] text-white/40 mt-1">Flat {{ coupon.discount | currency }} discount off total</p>
                      </div>
                      <button (click)="toggleCoupon(coupon.code)"
                        [class]="'px-2.5 py-1 rounded text-[9px] font-bold ' + (coupon.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')">
                        {{ coupon.active ? 'Active' : 'Disabled' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ADMIN TAB: GROWTH INSIGHTS -->
              <div *ngIf="activeAdminTab() === 'insights'" class="space-y-4 animate-fadeIn">
                <h3 class="text-lg font-black text-white">🤖 Platform Growth Insights</h3>
                <div class="space-y-4">
                  <div class="glass-soft rounded-2xl p-5 border border-red-500/20 space-y-2 bg-white/5">
                    <p class="text-xs font-black text-red-400 uppercase tracking-widest">🔥 Hotspot Identification</p>
                    <p class="text-xs text-white/70 leading-relaxed font-medium">
                      Marketplace demand in **Ann Arbor / University of Michigan campus** is outstripping merchant capacity. Recruits from local independent stores are recommended.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- 2. ADMIN ONBOARDING SETUP VIEW            -->
        <!-- ========================================== -->
        <div *ngIf="!isPlatformAdmin() && storeData() && !storeData()!.setupComplete" class="max-w-xl mx-auto space-y-6 animate-fadeIn py-6">
          <div class="text-center space-y-2">
            <span class="text-5xl">🏪</span>
            <h2 class="text-2xl font-black text-white tracking-tight">Let's Setup Your Pizzeria</h2>
            <p class="text-xs text-white/50 font-medium">Complete your store profile settings to launch your storefront catalog on the MiSlice comparison marketplace.</p>
          </div>

          <div class="glass rounded-[2rem] p-6 border border-white/10 bg-black/45 shadow-2xl space-y-4 text-xs">
            <h3 class="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">Store Profile Details</h3>
            
            <div class="space-y-3.5">
              <div>
                <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Store Name</label>
                <input type="text" [(ngModel)]="storeData()!.name" placeholder="e.g. Detroit Slice Co."
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500" />
              </div>

              <div>
                <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Brand Tagline</label>
                <input type="text" [(ngModel)]="storeData()!.tagline" placeholder="e.g. Crispy Detroit-Style Deep Dishes"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500" />
              </div>

              <div>
                <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Short Description</label>
                <textarea [(ngModel)]="storeData()!.description" placeholder="Describe your pizza specialities and unique ingredients..."
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500 h-20 resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Phone Number</label>
                  <input type="text" [(ngModel)]="storeData()!.phone" placeholder="313-555-0120"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500" />
                </div>
                <div>
                  <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Store Emoji Representation</label>
                  <select [(ngModel)]="storeData()!.emoji"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500">
                    <option value="🍕">🍕 Pizza Slice</option>
                    <option value="🏪">🏪 Storefront</option>
                    <option value="🔥">🔥 Flame / Brick Oven</option>
                    <option value="🪵">🪵 Woodfired Oven</option>
                  </select>
                </div>
              </div>

              <p class="text-[10px] font-black text-white/30 uppercase tracking-widest pt-2 border-t border-white/5">Delivery Parameters</p>
              
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Min Order ($)</label>
                  <input type="number" [(ngModel)]="storeData()!.minimumOrder" min="0" step="0.01"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-red-500 text-center" />
                </div>
                <div>
                  <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Delivery Fee ($)</label>
                  <input type="number" [(ngModel)]="storeData()!.deliveryFee" min="0" step="0.01"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-red-500 text-center" />
                </div>
                <div>
                  <label class="block text-[10px] text-white/40 uppercase mb-1 font-bold">Average ETA (Min)</label>
                  <input type="number" [(ngModel)]="storeData()!.averageEtaMinutes" min="0"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-red-500 text-center" />
                </div>
              </div>

              <button (click)="saveOnboarding()" [disabled]="savingOnboarding()"
                class="w-full py-4 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black rounded-xl transition duration-200 shadow-xl shadow-red-500/10 text-sm mt-3">
                {{ savingOnboarding() ? 'Launching Storefront...' : '🚀 Complete Store Onboarding' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- 3. STORE OWNER DASHBOARD VIEW              -->
        <!-- ========================================== -->
        <div *ngIf="!isPlatformAdmin() && storeData() && storeData()!.setupComplete" class="space-y-6 animate-fadeIn">
          <!-- MAIN HEADER CONSOLE -->
          <div class="glass rounded-[2rem] p-6 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900/90 to-red-950/20 shadow-xl">
            <div>
              <div class="flex items-center gap-2.5">
                <span class="text-3xl">{{ storeData()?.emoji || '🏪' }}</span>
                <div>
                  <h2 class="text-2xl font-black text-white tracking-tight">{{ storeData()?.name }}</h2>
                  <p class="text-xs text-white/50 font-medium">Store Console • ID: {{ storeData()?.id }}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <!-- Accepting orders toggle -->
              <div class="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-white/5 bg-white/5 shrink-0 ml-auto md:ml-0">
                <span class="text-xs font-bold" [class.text-emerald-400]="online()" [class.text-white/40]="!online()">
                  {{ online() ? '🟢 Accepting Orders' : '🔴 Closed / Offline' }}
                </span>
                <button (click)="toggleOnline()"
                  [class]="'w-9 h-5 rounded-full relative transition ' + (online() ? 'bg-emerald-500' : 'bg-white/15')">
                  <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md" [style.left]="online() ? '18px' : '2px'"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- SUCCESS / NOTIFICATION BANNERS -->
          <div *ngIf="successMsg()" class="glass border border-emerald-500/35 bg-emerald-500/10 rounded-2xl p-4 text-center text-emerald-400 font-bold text-sm animate-fadeIn">
            ✅ {{ successMsg() }}
          </div>
          <div *ngIf="ocrError()" class="glass border border-red-500/35 bg-red-500/10 rounded-2xl p-4 text-center text-red-400 font-bold text-sm animate-fadeIn">
            ⚠️ {{ ocrError() }}
          </div>

          <!-- MAIN TABS GRID -->
          <div class="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
            
            <!-- Sidebar Navigation -->
            <div class="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none shrink-0">
              @for (tab of tabs; track tab.id) {
                <button (click)="activeTab.set(tab.id)"
                  [class]="'glare-hover text-left px-4 py-3 rounded-2xl text-xs font-black transition whitespace-nowrap min-w-[140px] lg:min-w-0 flex items-center gap-3 ' +
                    (activeTab() === tab.id
                      ? 'bg-gradient-to-r from-red-700/80 to-orange-600/50 text-white border border-red-500/30 shadow-md'
                      : 'text-white/60 hover:text-white')">
                  <span class="text-sm">{{ tab.icon }}</span>
                  {{ tab.name }}
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

                <!-- AI INSIGHTS PANEL -->
                <div class="glass rounded-3xl p-5 border border-white/5 bg-gradient-to-br from-neutral-900 via-red-955/15 to-blue-955/10 space-y-3.5 shadow-lg relative overflow-hidden">
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
                    <p class="text-2xl font-black text-white mt-2">{{ storeData()?.ratingAvg || 4.8 }}</p>
                    <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Customer Rating</p>
                  </div>
                </div>

                <!-- Sales chart SVG -->
                <div class="glass rounded-3xl p-5 border border-white/5 bg-black/20 space-y-4">
                  <h4 class="text-xs font-black text-white/60 uppercase tracking-widest">Weekly Sales &amp; Traffic</h4>
                  <div class="h-44 w-full flex items-end">
                    <svg viewBox="0 0 400 150" class="w-full h-full text-red-500 overflow-visible">
                      <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                      <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                      <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                      <path d="M 20 120 L 80 90 L 140 110 L 200 60 L 260 80 L 320 40 L 380 30" fill="none" stroke="url(#gradient)" stroke-width="4" stroke-linecap="round"/>
                      <path d="M 20 120 L 80 90 L 140 110 L 200 60 L 260 80 L 320 40 L 380 30 L 380 150 L 20 150 Z" fill="url(#areaGradient)" opacity="0.15"/>
                      <circle cx="200" cy="60" r="5" fill="#f97316"/>
                      <circle cx="380" cy="30" r="5" fill="#dc2626"/>
                      <text x="20" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Mon</text>
                      <text x="140" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Wed</text>
                      <text x="260" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Fri</text>
                      <text x="380" y="145" fill="rgba(255,255,255,0.4)" font-size="9" text-anchor="middle">Today</text>
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

              <!-- TAB 3: MENU MANAGER -->
              <div *ngIf="activeTab() === 'menu'" class="space-y-4 animate-fadeIn">
                <div>
                  <h3 class="text-lg font-black text-white">🍕 Menu Catalog &amp; Price Manager</h3>
                  <p class="text-xs text-white/50 mt-0.5">Control pricing types, available custom options, and add/edit menu pizzas.</p>
                </div>

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

                  <!-- Suggestions list -->
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
                        class="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-black text-xs rounded-xl transition shadow-lg">
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
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs text-white/40">$</span>
                        <input type="number" [(ngModel)]="item.basePrice" min="0" step="0.01"
                          class="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center text-white outline-none focus:border-red-500" />
                        <button (click)="saveItem(item)" [disabled]="savingItem()"
                          class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition">Save</button>
                      </div>
                      <button (click)="toggleAvailability(item)"
                        [class]="'px-3 py-1 rounded-lg text-[10px] font-bold transition ' + (item.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')">
                        {{ item.available ? 'In Stock' : 'Out of Stock' }}
                      </button>
                      <button (click)="deleteItem(item)"
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
                  <div class="glass rounded-2xl p-5 border border-white/5 space-y-3 bg-white/5 flex flex-col justify-between">
                    <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider">Create Custom Promo / BOGO</h4>
                    <div class="space-y-3 text-xs">
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Deal Title</label>
                        <input type="text" [(ngModel)]="newDeal.title" placeholder="Double Play: 2 Mediums for $19.99"
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
                </div>
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
                  </div>
                </div>
              </div>

              <!-- TAB 6: STORE HOURS & SETTINGS -->
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
                    <div>
                      <label class="block text-[10px] text-white/40 mb-1">Restaurant/Brand Name</label>
                      <input type="text" [(ngModel)]="storeData()!.name"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label class="block text-[10px] text-white/40 mb-1">Tagline</label>
                      <input type="text" [(ngModel)]="storeData()!.tagline"
                        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Phone Number</label>
                        <input type="text" [(ngModel)]="storeData()!.phone"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Category</label>
                        <input type="text" [(ngModel)]="storeData()!.category"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Min Order ($)</label>
                        <input type="number" [(ngModel)]="storeData()!.minimumOrder" min="0" step="0.01"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Delivery Fee ($)</label>
                        <input type="number" [(ngModel)]="storeData()!.deliveryFee" min="0" step="0.01"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label class="block text-[10px] text-white/40 mb-1">Prep Time (min)</label>
                        <input type="number" [(ngModel)]="storeData()!.averageEtaMinutes" min="0"
                          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                    </div>
                    <button (click)="saveSettings()" [disabled]="savingSettings()"
                      class="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 text-white font-black rounded-xl transition shadow-lg mt-3">
                      {{ savingSettings() ? 'Saving Hours & Settings...' : 'Save Operations Settings' }}
                    </button>
                  </div>

                  <div class="space-y-4">
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
                <div class="grid md:grid-cols-3 gap-4">
                  <div class="glass p-4 rounded-2xl border border-white/5 text-center bg-white/5">
                    <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">AOV (Average Order Value)</p>
                    <p class="text-3xl font-black text-white mt-1">$28.15</p>
                  </div>
                  <div class="glass p-4 rounded-2xl border border-white/5 text-center bg-white/5">
                    <p class="text-white/40 text-[10px] font-black uppercase tracking-wider">Quote Conversion Rate</p>
                    <p class="text-3xl font-black text-white mt-1">4.82%</p>
                  </div>
                </div>
              </div>

              <!-- TAB 8: FINANCIALS / BILLING -->
              <div *ngIf="activeTab() === 'finance'" class="space-y-6 animate-fadeIn">
                <div class="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 class="text-lg font-black text-white">💳 Financials &amp; Billing</h3>
                    <p class="text-xs text-white/50 mt-0.5">Request payouts, review payout history logs, and verify connected bank billing info.</p>
                  </div>
                  <button (click)="requestPayout()" [disabled]="netEarnings() <= 0"
                    class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-black text-xs rounded-xl transition shadow-lg">
                    💰 Request Instant Payout
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
                  </div>
                </div>
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

              <!-- TAB 9: TEAM MEMBERS -->
              <div *ngIf="activeTab() === 'staff'" class="space-y-6 animate-fadeIn">
                <div class="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 class="text-lg font-black text-white">👥 Staff &amp; Team Members</h3>
                    <p class="text-xs text-white/50 mt-0.5">Add managers, chefs, and employee accounts to restrict backend console permissions.</p>
                  </div>
                  <button (click)="showInviteStaff.set(true)" 
                    class="px-3 py-1.5 rounded-lg text-xs font-black text-white bg-red-600 hover:bg-red-500 transition shadow-lg">
                    + Invite Staff
                  </button>
                </div>

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
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly orderService = inject(OrderService);
  private readonly menuService = inject(MenuService);
  private readonly authService = inject(AuthService);

  // Platform admin properties
  restaurants = signal<Store[]>([]);
  successMsg = signal('');
  activeAdminTab = signal('overview');
  selectedStatusTab = signal('all');

  adminTabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'restaurants', name: 'Partners Audit', icon: '🏪' },
    { id: 'orders', name: 'Global Orders Feed', icon: '📦' },
    { id: 'payouts', name: 'Payouts Manager', icon: '💰' },
    { id: 'coupons', name: 'Platform Coupons', icon: '🎟️' },
    { id: 'insights', name: 'AI Insights', icon: '🤖' }
  ];

  platformOrders = signal<PlatformOrder[]>([
    { id: '10982', storeName: 'Shamz Pizza', userEmail: 'customer@mislice.com', total: 11.99, status: 'DELIVERED' },
    { id: '10983', storeName: "Domino's", userEmail: 'sathya@gmail.com', total: 14.99, status: 'PREPARING' },
    { id: '10984', storeName: "Bunty's Pizza", userEmail: 'alex@mislice.com', total: 10.99, status: 'PLACED' }
  ]);

  payouts = signal<Payout[]>([
    { id: '1', storeName: 'Shamz Pizza', amount: 450.00, status: 'PENDING', date: '2026-07-08' },
    { id: '2', storeName: "Bunty's Pizza", amount: 280.00, status: 'PENDING', date: '2026-07-08' },
    { id: '3', storeName: "Domino's", amount: 1200.00, status: 'PAID', date: '2026-07-01' }
  ]);

  coupons = signal<PlatformCoupon[]>([
    { code: 'MISLICE20', discount: 5, active: true },
    { code: 'WELCOME5', discount: 5, active: true }
  ]);

  newCode = '';
  newDiscount = 5;

  activeCount = computed(() => this.restaurants().filter(s => s.approved).length);
  pendingCount = computed(() => this.restaurants().filter(s => !s.approved).length);
  totalRevenue = computed(() => this.platformOrders().reduce((sum, o) => sum + o.total, 0));

  filteredRestaurants = computed(() => {
    const list = this.restaurants();
    const tab = this.selectedStatusTab();
    if (tab === 'pending') {
      return list.filter(s => !s.approved);
    } else if (tab === 'approved') {
      return list.filter(s => s.approved);
    }
    return list;
  });

  // Dynamic branching flags
  isPlatformAdmin = computed(() => {
    const email = this.authService.currentUser()?.email;
    return email === 'sathyasai1415@gmail.com' || email === 'admin@mislice.com';
  });

  storeData = signal<Store | null>(null);
  loading = signal(true);
  savingOnboarding = signal(false);

  // Store Dashboard properties (reused)
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

  ocrSuggestions = signal<any[]>([]);
  processingOcr = signal(false);
  importingOcr = signal(false);
  ocrError = signal('');

  showInviteStaff = signal(false);
  newStaff = { name: '', email: '', role: 'Manager' as StaffMember['role'] };
  staffList: StaffMember[] = [
    { id: '1', name: 'Demo Store Owner', role: 'Owner', email: 'owner@shamzpizza.com', status: 'Active', joinedAt: '2026-01-10' },
    { id: '2', name: 'Chef Mario', role: 'Chef', email: 'mario@shamzpizza.com', status: 'Active', joinedAt: '2026-03-12' },
    { id: '3', name: 'Angela Lopez', role: 'Manager', email: 'angela@shamzpizza.com', status: 'Active', joinedAt: '2026-04-01' }
  ];

  payoutHistory: PayoutRecord[] = [
    { id: 'PO-920482', date: '2026-07-01', amount: 1402.50, status: 'Completed', bankAccount: 'Chase Bank (...9821)' },
    { id: 'PO-882104', date: '2026-06-15', amount: 1120.00, status: 'Completed', bankAccount: 'Chase Bank (...9821)' }
  ];

  mockReviews = [
    { author: 'David K.', rating: 5, date: '2026-07-08', comment: 'The Detroit square deep dish is easily the best value for money in the city. The crust is amazingly crispy!' },
    { author: 'Sarah M.', rating: 4, date: '2026-07-06', comment: 'Super fast delivery and prices compared on MiSlice were accurate. The garlic butter crust flavor is fantastic.' }
  ];

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
  newItem = { name: '', basePrice: 9.99, itemType: 'PIZZA' };
  newDeal: { title: string; description: string; originalPrice: number | null; discountedPrice: number | null } =
    { title: '', description: '', originalPrice: null, discountedPrice: null };

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
    this.loading.set(true);
    if (this.isPlatformAdmin()) {
      this.loadPlatformAdminData();
    } else {
      this.loadStoreOwnerData();
    }
  }

  loadPlatformAdminData() {
    this.adminService.getAllRestaurants().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadStoreOwnerData() {
    this.restaurantService.getMyRestaurants().subscribe({
      next: (data) => {
        if (data.length > 0) {
          const shop = data[0];
          this.storeData.set(shop);
          this.online.set(shop.acceptingOrders);
          this.loadOrders();
          this.loadMenu();
          this.loadDeals();
        } else {
          // If owner has no store yet, initialize a blank/temporary record structure for onboarding
          const email = this.authService.currentUser()?.email || '';
          const namePrefix = email ? email.split('@')[0] : 'Owner';
          this.storeData.set({
            id: 'temp-store-id',
            name: `${namePrefix}'s Pizza Shop`,
            slug: `${namePrefix.toLowerCase()}-pizza-shop`,
            tagline: 'Authentic Local Pizzeria',
            description: 'Provide your custom description here...',
            phone: '555-010-0000',
            emoji: '🏪',
            addressLine: '123 Main St',
            city: 'Detroit',
            state: 'MI',
            postalCode: '48201',
            logoUrl: '',
            brandColor: '#dc2626',
            ratingAvg: 4.5 as any,
            ratingCount: 0,
            acceptingOrders: true,
            approved: true,
            applicationStatus: 'APPROVED',
            setupComplete: false,
            deliveryFee: 2.99 as any,
            deliveryRadiusMiles: 5.0 as any,
            minimumOrder: 15.00 as any,
            averageEtaMinutes: 25,
            trendScore: 0,
            featured: false,
            newStore: true,
            tags: [],
            category: 'LOCAL',
            priceRange: '$$'
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveOnboarding() {
    const store = this.storeData();
    if (!store) return;
    this.savingOnboarding.set(true);

    if (store.id === 'temp-store-id') {
      // Create new restaurant profile in backend
      this.restaurantService.updateRestaurant(store.id, {
        ...store,
        id: undefined, // Let backend assign or use standard endpoint
        setupComplete: true
      }).subscribe({
        next: (saved) => {
          this.storeData.set(saved);
          this.online.set(saved.acceptingOrders);
          this.savingOnboarding.set(false);
          this.loadOrders();
          this.loadMenu();
          this.loadDeals();
        },
        error: () => this.savingOnboarding.set(false)
      });
    } else {
      // Update setupComplete on existing restaurant profile
      this.restaurantService.updateRestaurant(store.id, {
        ...store,
        setupComplete: true
      }).subscribe({
        next: (saved) => {
          this.storeData.set(saved);
          this.online.set(saved.acceptingOrders);
          this.savingOnboarding.set(false);
          this.loadOrders();
          this.loadMenu();
          this.loadDeals();
        },
        error: () => this.savingOnboarding.set(false)
      });
    }
  }

  // --- Platform Admin Actions ---
  approve(id: string) {
    this.adminService.approveRestaurant(id).subscribe({
      next: () => {
        this.successMsg.set('Restaurant approved successfully.');
        this.loadPlatformAdminData();
        setTimeout(() => this.successMsg.set(''), 3000);
      }
    });
  }

  reject(id: string) {
    if (confirm('Are you sure you want to delete this restaurant partnership listing?')) {
      this.adminService.rejectRestaurant(id).subscribe({
        next: () => {
          this.successMsg.set('Restaurant partnership removed.');
          this.loadPlatformAdminData();
          setTimeout(() => this.successMsg.set(''), 3000);
        }
      });
    }
  }

  markPaid(payoutId: string) {
    this.payouts.update(list => list.map(p => p.id === payoutId ? { ...p, status: 'PAID' } : p));
  }

  createCoupon() {
    const code = this.newCode.trim().toUpperCase();
    if (!code) return;
    this.coupons.update(list => [...list, { code, discount: this.newDiscount, active: true }]);
    this.newCode = '';
  }

  toggleCoupon(code: string) {
    this.coupons.update(list => list.map(c => c.code === code ? { ...c, active: !c.active } : c));
  }

  // --- Store Dashboard Actions ---
  loadOrders() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    this.loadingOrders.set(true);
    this.orderService.getRestaurantOrders(shop.id).subscribe({
      next: (ordersList) => { this.orders.set(ordersList); this.loadingOrders.set(false); },
      error: () => this.loadingOrders.set(false)
    });
  }

  loadMenu() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    this.loadingMenu.set(true);
    this.menuService.getMenuItems(shop.id).subscribe({
      next: (items) => { this.menuItems.set(items); this.loadingMenu.set(false); },
      error: () => this.loadingMenu.set(false)
    });
  }

  loadDeals() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
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

  saveItem(item: MenuItem) {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    this.savingItem.set(true);
    this.menuService.saveMenuItem(shop.id, item).subscribe({
      next: () => this.savingItem.set(false),
      error: () => this.savingItem.set(false)
    });
  }

  toggleAvailability(item: MenuItem) {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    const next = !item.available;
    this.menuService.updateAvailability(shop.id, item.id, next).subscribe({
      next: () => this.menuItems.update(list => list.map(i => i.id === item.id ? { ...i, available: next } : i))
    });
  }

  addItem() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id' || !this.newItem.name.trim()) return;
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
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    this.menuService.deleteMenuItem(shop.id, item.id).subscribe({
      next: () => this.menuItems.update(list => list.filter(i => i.id !== item.id))
    });
  }

  addDeal() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id' || !this.newDeal.title.trim()) return;
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
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    this.restaurantService.saveDeal(shop.id, { ...deal, active: !deal.active }).subscribe({
      next: () => this.loadDeals()
    });
  }

  applyQuickAction(type: string): void {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
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

  toggleOnline() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    const next = !this.online();
    this.online.set(next);
    const updated = { ...shop, acceptingOrders: next };
    this.storeData.set(updated);
    this.restaurantService.updateRestaurant(shop.id, updated).subscribe({
      error: () => { this.online.set(!next); }
    });
  }

  saveSettings() {
    const shop = this.storeData();
    if (!shop || shop.id === 'temp-store-id') return;
    this.savingSettings.set(true);
    this.settingsSaved.set(false);
    this.restaurantService.updateRestaurant(shop.id, shop).subscribe({
      next: (saved) => {
        this.storeData.set(saved);
        this.savingSettings.set(false);
        this.settingsSaved.set(true);
        setTimeout(() => this.settingsSaved.set(false), 2500);
      },
      error: () => this.savingSettings.set(false)
    });
  }

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

  onMenuFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    const shop = this.storeData();
    if (!file || !shop || shop.id === 'temp-store-id') return;

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
    const shop = this.storeData();
    const selected = this.ocrSuggestions().filter(s => s.selected);
    if (!shop || shop.id === 'temp-store-id' || selected.length === 0) return;

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
