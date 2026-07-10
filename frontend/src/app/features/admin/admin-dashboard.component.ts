import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Store } from '../../shared/models';

interface PlatformCoupon { code: string; discount: number; active: boolean; }
interface Payout { id: string; storeName: string; amount: number; status: string; date: string; }
interface PlatformOrder { id: string; storeName: string; userEmail: string; total: number; status: string; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="w-full min-h-screen bg-[#080808] text-white">
      
      <!-- LOADING STATE -->
      <div *ngIf="loading()" class="p-20 text-center flex items-center justify-center min-h-screen bg-[#080808]">
        <div class="flex flex-col items-center gap-3">
          <div class="animate-spin rounded-full h-9 w-9 border-t-2 border-red-600"></div>
          <p class="text-xs text-white/40 font-bold">Verifying administration credentials...</p>
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
        <!-- 2. ACCESS DENIED FOR NON-ADMINS            -->
        <!-- ========================================== -->
        <div *ngIf="!isPlatformAdmin()" class="max-w-md mx-auto py-12 space-y-6 text-center animate-fadeIn">
          <span class="text-5xl">🛡️</span>
          <h2 class="text-2xl font-black tracking-tight">Access Denied</h2>
          <p class="text-xs text-white/50 leading-relaxed">You do not have administrative privileges to access the Platform Administration Console.</p>
          
          <div class="flex flex-col gap-2 pt-2">
            <button (click)="goToOwnerDashboard()" 
              class="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black rounded-xl transition text-xs shadow-lg shadow-red-500/10">
              Go to Store Owner Console 🏪
            </button>
            <button (click)="goToHome()" 
              class="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition text-xs">
              Go to Customer Home 🍕
            </button>
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Platform admin properties
  restaurants = signal<Store[]>([]);
  successMsg = signal('');
  activeAdminTab = signal('overview');
  selectedStatusTab = signal('all');
  loading = signal(true);

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

  ngOnInit() {
    this.loading.set(true);
    if (this.isPlatformAdmin()) {
      this.loadPlatformAdminData();
    } else {
      this.loading.set(false);
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

  goToOwnerDashboard() {
    this.router.navigate(['/owner']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
