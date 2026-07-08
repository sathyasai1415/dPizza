import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Store } from '../../shared/models';

interface PlatformCoupon { code: string; discount: number; active: boolean; }
interface Payout { id: string; storeName: string; amount: number; status: string; date: string; }
interface PlatformOrder { id: string; storeName: string; userEmail: string; total: number; status: string; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="max-w-6xl mx-auto py-6 space-y-6">
      
      <!-- HEADER -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-lg">🛡️</div>
        <div>
          <h2 class="text-2xl sm:text-3xl font-black text-white">Platform Administration</h2>
          <p class="text-xs text-white/50">Approve partners, monitor operations, and manage the marketplace.</p>
        </div>
      </div>

      <!-- MAIN TABS LAYOUT -->
      <div class="grid md:grid-cols-[220px_1fr] gap-6 items-start">
        
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
              <span *ngIf="tab.id === 'restaurants' && pendingCount() > 0"
                class="ml-auto w-5 h-5 rounded-full bg-yellow-500 text-black text-[10px] font-bold flex items-center justify-center animate-pulse">
                {{ pendingCount() }}
              </span>
            </button>
          }
        </div>

        <!-- Selected Tab content card -->
        <div class="glass rounded-[2rem] p-6 min-h-[400px] border border-white/5 bg-black/20">
          
          <!-- TAB 1: OVERVIEW -->
          <div *ngIf="activeTab() === 'overview'" class="space-y-6 animate-fadeIn">
            <h3 class="text-lg font-black text-white">📊 Platform Overview</h3>
            
            <!-- Stat Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">🏪</span>
                <p class="text-xl font-black text-white mt-1">{{ activeCount() }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Active Stores</p>
              </div>
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">⏳</span>
                <p class="text-xl font-black text-white mt-1">{{ pendingCount() }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Pending Review</p>
              </div>
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">💰</span>
                <p class="text-xl font-black text-white mt-1">{{ totalRevenue() | currency }}</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Gross GMV</p>
              </div>
              <div class="glass rounded-xl p-4 border border-white/5">
                <span class="text-base">🛡️</span>
                <p class="text-xl font-black text-white mt-1">20%</p>
                <p class="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Platform Fee</p>
              </div>
            </div>

            <!-- Platform distribution graph visual (mocked cleanly) -->
            <div class="glass-soft rounded-2xl p-5 border border-white/5 space-y-4">
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
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span>Grand Rapids</span>
                    <span class="text-white/60 font-bold">10%</span>
                  </div>
                  <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div class="bg-yellow-500 h-full rounded-full" style="width: 10%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: PARTNER APPLICATIONS -->
          <div *ngIf="activeTab() === 'restaurants'" class="space-y-4 animate-fadeIn">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="text-lg font-black text-white">🏪 Restaurant Listings</h3>
              <!-- Status Sub-tabs -->
              <div class="flex gap-1 bg-white/5 p-1 rounded-xl">
                <button *ngFor="let sTab of ['all', 'pending', 'approved']" (click)="selectedStatusTab.set(sTab)"
                  [class]="'px-3 py-1 rounded-lg text-[10px] font-black capitalize ' + (selectedStatusTab() === sTab ? 'bg-red-600 text-white shadow-sm' : 'text-white/50 hover:text-white')">
                  {{ sTab }}
                </button>
              </div>
            </div>

            <div *ngIf="loading()" class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
            </div>

            <!-- SUCCESS ALERTS -->
            <div *ngIf="successMsg()" class="bg-green-500/15 border border-green-500/30 text-green-300 p-4 rounded-xl text-xs font-medium">
              {{ successMsg() }}
            </div>

            <!-- TABLE -->
            <div *ngIf="!loading()" class="overflow-x-auto">
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
                      <span [class]="shop.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
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

          <!-- TAB 3: PLATFORM ORDERS -->
          <div *ngIf="activeTab() === 'orders'" class="space-y-4 animate-fadeIn">
            <h3 class="text-lg font-black text-white">📦 Global Orders Feed</h3>
            <p class="text-xs text-white/50">Live feed of all transactions happening across Michigan on the MiSlice platform.</p>

            <div class="space-y-2.5 pt-2">
              <div *ngFor="let order of platformOrders()" class="glass rounded-xl p-4 border border-white/5 flex items-center justify-between text-xs">
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

          <!-- TAB 4: PAYOUTS MANAGER -->
          <div *ngIf="activeTab() === 'payouts'" class="space-y-4 animate-fadeIn">
            <h3 class="text-lg font-black text-white">💰 Restaurant Payouts</h3>
            <p class="text-xs text-white/50">Disburse weekly store earnings minus the platform commission.</p>

            <div class="space-y-2 pt-2">
              <div *ngFor="let p of payouts()" class="glass rounded-xl p-4 border border-white/5 flex justify-between items-center text-xs">
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

          <!-- TAB 5: PLATFORM COUPONS -->
          <div *ngIf="activeTab() === 'coupons'" class="space-y-4 animate-fadeIn">
            <h3 class="text-lg font-black text-white">🎟️ Platform Discount Codes</h3>
            <p class="text-xs text-white/50">Manage platform-wide marketing coupons (discounts applied at checkout).</p>

            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Form -->
              <div class="glass rounded-2xl p-4 border border-white/5 space-y-3">
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
                    class="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition">
                    Create Coupon Code
                  </button>
                </div>
              </div>

              <!-- List -->
              <div class="space-y-2">
                <div *ngFor="let coupon of coupons()" class="glass rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
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

          <!-- TAB 6: AI INSIGHTS -->
          <div *ngIf="activeTab() === 'insights'" class="space-y-4 animate-fadeIn">
            <h3 class="text-lg font-black text-white">🤖 Platform Growth Insights</h3>
            
            <div class="space-y-4">
              <div class="glass-soft rounded-2xl p-5 border border-red-500/20 space-y-2">
                <p class="text-xs font-black text-red-400 uppercase tracking-widest">🔥 Hotspot Identification</p>
                <p class="text-xs text-white/70 leading-relaxed">
                  Marketplace demand in **Ann Arbor / University of Michigan campus** is outstripping merchant capacity. Recruits from local independent stores are recommended.
                </p>
              </div>

              <div class="glass-soft rounded-2xl p-5 border border-blue-500/20 space-y-2">
                <p class="text-xs font-black text-blue-400 uppercase tracking-widest">📈 Revenue Growth</p>
                <p class="text-xs text-white/70 leading-relaxed">
                  Monthly recurring GMV increased by **21.5%** following the release of the dynamic interactive pizza price map.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  restaurants = signal<Store[]>([]);
  loading = signal(true);
  successMsg = signal('');
  activeTab = signal('overview');
  selectedStatusTab = signal('all');

  tabs = [
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

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.adminService.getAllRestaurants().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  approve(id: string) {
    this.adminService.approveRestaurant(id).subscribe({
      next: () => {
        this.successMsg.set('Restaurant approved successfully.');
        this.loadData();
        setTimeout(() => this.successMsg.set(''), 3000);
      }
    });
  }

  reject(id: string) {
    if (confirm('Are you sure you want to delete this restaurant partnership listing?')) {
      this.adminService.rejectRestaurant(id).subscribe({
        next: () => {
          this.successMsg.set('Restaurant partnership removed.');
          this.loadData();
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
}
