import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Deal, Store } from '../../shared/models';

interface DealVM {
  deal: Deal;
  store?: Store;
  savings: number;
  pct: number;
  distanceMi?: number;
}

interface Category { id: string; label: string; match: (d: DealVM) => boolean; }

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="w-full space-y-6 max-w-[1400px] mx-auto px-4 py-6">
      <!-- Header -->
      <div class="relative overflow-hidden rounded-[28px] border border-orange-500/40 p-6 sm:p-8 bg-brand-white shadow-md">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_45%)] pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span class="inline-flex items-center gap-2 rounded-full bg-brand-orange text-brand-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-orange-400/30">🔥 Live Michigan Deals</span>
            <h1 class="mt-4 text-3xl sm:text-4xl font-black text-brand-black">Deals &amp; Offers</h1>
            <p class="mt-2 text-sm text-brand-orange/70 font-bold">The best pizza deals from restaurants near you — right now.</p>
          </div>
          <button (click)="requestLocation()" class="shrink-0 self-start sm:self-auto text-xs font-bold text-brand-black bg-brand-white border border-brand-black px-4 py-2.5 rounded-2xl hover:bg-brand-white transition shadow-sm">
            {{ userLoc() ? '📍 Near you · on' : '📍 Use my location' }}
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-8 items-start">
        
        <!-- LEFT SIDEBAR: FILTERS -->
        <div class="hidden lg:block w-56 shrink-0 space-y-6 sticky top-6">
          <h3 class="text-xl font-black text-brand-black tracking-tight border-b border-brand-black pb-2">Filters</h3>
          
          <div class="space-y-4 pt-2">
            
            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-bold text-brand-black group-hover:text-brand-orange transition">Free Delivery</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('free_delivery')" [checked]="filters().includes('free_delivery')" />
                <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>
            
            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-bold text-brand-black group-hover:text-brand-orange transition">Favourites</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('favourites')" [checked]="filters().includes('favourites')" />
                <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-bold text-brand-black group-hover:text-brand-orange transition">4+ Stars</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('rating')" [checked]="filters().includes('rating')" />
                <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-bold text-brand-black group-hover:text-brand-orange transition">Open Now</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('open_now')" [checked]="filters().includes('open_now')" />
                <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-bold text-brand-black group-hover:text-brand-orange transition">Under $10</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('under10')" [checked]="filters().includes('under10')" />
                <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>

          </div>
        </div>

        <!-- MAIN CONTENT -->
        <div class="flex-1 min-w-0 space-y-6">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <!-- Category chips -->
            <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none flex-1">
              @for (c of categories; track c.id) {
                @if (c.id === 'all' || countFor(c) > 0) {
                  <button (click)="activeCat.set(c.id)"
                    [class]="'shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap shadow-sm ' + (activeCat() === c.id ? 'bg-brand-black text-brand-white' : 'bg-brand-white text-brand-black hover:text-brand-orange border border-brand-black')">
                    {{ c.label }}<span class="opacity-60 ml-1.5">{{ c.id === 'all' ? vms().length : countFor(c) }}</span>
                  </button>
                }
              }
            </div>

            <!-- Sort -->
            <select [ngModel]="sort()" (ngModelChange)="sort.set($any($event))"
              class="shrink-0 bg-brand-white border border-brand-black rounded-xl px-4 py-2.5 text-xs font-bold text-brand-black outline-none focus:border-brand-red shadow-sm cursor-pointer">
              <option class="bg-brand-white" value="discount">Sort: Best Discount</option>
              <option class="bg-brand-white" value="expiring">Expiring Soon</option>
              <option class="bg-brand-white" value="price">Price: Low → High</option>
              <option class="bg-brand-white" value="distance">Nearest</option>
              <option class="bg-brand-white" value="rating">Top Rated</option>
            </select>
          </div>

          <!-- Loading -->
          <div *ngIf="loading()" class="flex justify-center py-16"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div></div>

          <!-- Empty -->
          <div *ngIf="!loading() && visible().length === 0" class="clay rounded-[2rem] p-12 text-center text-brand-black bg-brand-white shadow-sm border border-brand-black">
            <p class="text-5xl mb-4">🏷️</p>
            <p class="text-xl font-black text-brand-black mb-2">No deals match this view</p>
            <p class="text-sm font-semibold max-w-md mx-auto">Try a different category or clear your filters — new offers post all the time.</p>
          </div>

          <!-- Deals grid -->
          <div *ngIf="!loading() && visible().length > 0" class="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (vm of visible(); track vm.deal.id) {
              <div class="clay rounded-[2rem] overflow-hidden flex flex-col hover:border-brand-red hover:shadow-xl border border-brand-black transition group bg-brand-white">
                <!-- image / banner -->
                <div class="relative h-36 flex items-center justify-center text-5xl"
                  [style.background]="vm.store?.brandColor || 'linear-gradient(135deg,#7f1d1d,#c2410c)'">
                  <img *ngIf="vm.deal.imageUrl" [src]="vm.deal.imageUrl" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span *ngIf="!vm.deal.imageUrl" class="group-hover:scale-110 transition duration-300">🍕</span>
                  @if (vm.pct > 0) {
                    <span class="absolute top-3 left-3 text-[11px] font-black text-brand-white bg-brand-red px-3 py-1 rounded-full shadow-lg">SAVE {{ vm.pct }}%</span>
                  }
                  <span class="absolute top-3 right-3 text-[10px] font-black text-brand-black bg-brand-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm">{{ timeLeft(vm.deal) }}</span>
                </div>

                <div class="p-5 flex flex-col flex-1">
                  <!-- restaurant row -->
                  <div class="flex items-center gap-2 mb-3 border-b border-gray-100 pb-3">
                    <span class="text-xl">{{ vm.store?.emoji || '🏪' }}</span>
                    <span class="text-sm font-black text-brand-black truncate flex-1">{{ vm.store?.name || 'Local Pizzeria' }}</span>
                    <span class="text-[11px] font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md">★ {{ (vm.store?.ratingAvg || 4.5) | number:'1.1-1' }}</span>
                  </div>

                  <p class="text-base font-black text-brand-black leading-tight">{{ vm.deal.title }}</p>
                  <p class="text-xs text-brand-black/70 mt-1 line-clamp-2 flex-1 font-semibold leading-relaxed">{{ vm.deal.description }}</p>

                  <!-- price -->
                  <div class="flex items-end gap-2 mt-4">
                    <span class="text-3xl font-black text-brand-red leading-none">{{ (vm.deal.discountedPrice ?? vm.deal.originalPrice) | currency }}</span>
                    @if (vm.deal.originalPrice && vm.deal.originalPrice > (vm.deal.discountedPrice ?? 0)) { 
                      <span class="text-xs text-brand-black/50 font-bold line-through mb-1">{{ vm.deal.originalPrice | currency }}</span> 
                    }
                    <span class="flex-1"></span>
                    @if (vm.savings > 0) { <span class="text-[10px] font-black text-brand-green bg-green-50 px-2 py-1 rounded-md uppercase tracking-wider mb-1">Save {{ vm.savings | currency }}</span> }
                  </div>

                  <!-- meta -->
                  <div class="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-[10px] text-brand-black font-bold uppercase tracking-wider">
                    <span class="flex items-center gap-1">⏱️ {{ vm.store?.averageEtaMinutes || 25 }}m</span>
                    <span class="flex items-center gap-1">{{ (vm.store?.deliveryFee ?? 0) > 0 ? ('🛵 ' + (vm.store?.deliveryFee | currency)) : '🛵 Free' }}</span>
                    @if (vm.distanceMi != null) { <span class="flex items-center gap-1">📍 {{ vm.distanceMi | number:'1.1-1' }}m</span> }
                    @else if (vm.store?.city) { <span class="flex items-center gap-1">📍 {{ vm.store?.city }}</span> }
                  </div>

                  <!-- actions -->
                  <div class="grid grid-cols-2 gap-3 mt-5">
                    <button (click)="viewDeal(vm)" class="py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-brand-black bg-brand-white border border-brand-black hover:bg-gray-50 transition shadow-sm">Details</button>
                    <button (click)="orderNow(vm)" class="py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-brand-white bg-brand-black hover:bg-brand-red transition shadow-sm">Order Now</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DealsComponent implements OnInit, OnDestroy {
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);

  private allVms = signal<DealVM[]>([]);
  loading = signal(true);
  activeCat = signal('all');
  filters = signal<string[]>([]);
  sort = signal<'discount' | 'expiring' | 'price' | 'distance' | 'rating'>('discount');
  userLoc = signal<{ lat: number; lng: number } | null>(null);
  private now = signal(Date.now());
  private timer?: any;

  vms = computed(() => this.allVms());

  categories: Category[] = [
    { id: 'all', label: '✨ All', match: () => true },
    { id: 'trending', label: '🔥 Trending', match: d => d.pct >= 30 },
    { id: 'near', label: '📍 Near You', match: d => d.distanceMi != null && d.distanceMi <= 5 },
    { id: 'bogo', label: '🍕 BOGO', match: d => /bogo|buy one|2 for|two for/i.test(this.txt(d)) },
    { id: 'under10', label: '💰 Under $10', match: d => (d.deal.discountedPrice ?? 99) < 10 },
    { id: 'family', label: '🎉 Family', match: d => /family|combo|bundle|party/i.test(this.txt(d)) },
    { id: 'student', label: '👨‍🎓 Student', match: d => /student/i.test(this.txt(d)) },
    { id: 'latenight', label: '🌙 Late Night', match: d => /late|night|midnight/i.test(this.txt(d)) },
    { id: 'wings', label: '🍗 Pizza & Wings', match: d => /wing/i.test(this.txt(d)) },
    { id: 'lunch', label: '🍽️ Lunch', match: d => /lunch/i.test(this.txt(d)) },
    { id: 'flash', label: '⚡ Flash', match: d => this.msLeft(d.deal) > 0 && this.msLeft(d.deal) < 3 * 3600_000 },
    { id: 'new', label: '🆕 New', match: d => !!d.store?.newStore },
  ];

  ngOnInit(): void {
    forkJoin({
      deals: this.restaurantService.getActiveDeals(),
      stores: this.restaurantService.getRestaurants(),
    }).subscribe({
      next: ({ deals, stores }) => {
        const byId = new Map(stores.map(s => [s.id, s]));
        const vms = (deals ?? []).map(deal => {
          const store = byId.get(deal.restaurantId);
          const orig = Number(deal.originalPrice) || 0;
          const disc = Number(deal.discountedPrice) || 0;
          const savings = orig > 0 && disc > 0 ? Math.max(0, orig - disc) : 0;
          const pct = orig > 0 && savings > 0 ? Math.round((savings / orig) * 100) : (deal.discountType === 'percentage' ? (deal.discountValue || 0) : 0);
          return { deal, store, savings, pct } as DealVM;
        });
        this.allVms.set(vms);
        this.loading.set(false);
        this.recomputeDistance();
      },
      error: () => this.loading.set(false),
    });
    // tick every 30s to keep expiry timers fresh
    this.timer = setInterval(() => this.now.set(Date.now()), 30_000);
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private txt(d: DealVM): string { return `${d.deal.title} ${d.deal.description ?? ''} ${d.store?.name ?? ''}`; }
  private msLeft(deal: Deal): number { return deal.expiresAt ? new Date(deal.expiresAt).getTime() - this.now() : Number.POSITIVE_INFINITY; }

  timeLeft(deal: Deal): string {
    if (!deal.expiresAt) return 'Ongoing';
    const ms = this.msLeft(deal);
    if (ms <= 0) return 'Ended';
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    if (h >= 24) return `${Math.floor(h / 24)}d left`;
    return h > 0 ? `Ends in ${h}h ${m}m` : `Ends in ${m}m`;
  }

  countFor(c: Category): number { return this.allVms().filter(c.match).length; }

  visible = computed<DealVM[]>(() => {
    const cat = this.categories.find(c => c.id === this.activeCat()) ?? this.categories[0];
    const f = this.filters();
    let list = this.allVms().filter(cat.match).filter(vm => {
      // Free Delivery logic (assuming delivery fee is 0 or null)
      if (f.includes('free_delivery') && (vm.store?.deliveryFee ?? 0) > 0) return false;
      
      // Under $10 logic
      if (f.includes('under10') && (vm.deal.discountedPrice ?? 99) >= 10) return false;
      
      // Rating logic
      if (f.includes('rating') && (vm.store?.ratingAvg ?? 0) < 4.5) return false;
      
      // Open Now logic (mocked logic - just a frontend placeholder)
      if (f.includes('open_now') && false) return false; // In a real app we'd check store hours
      
      // Favourites logic (mocked logic - just a frontend placeholder)
      if (f.includes('favourites') && false) return false; // In a real app we'd check user profile
      
      return true;
    });
    
    const s = this.sort();
    list = [...list].sort((a, b) => {
      switch (s) {
        case 'expiring': return this.msLeft(a.deal) - this.msLeft(b.deal);
        case 'price': return (a.deal.discountedPrice ?? 99) - (b.deal.discountedPrice ?? 99);
        case 'distance': return (a.distanceMi ?? 999) - (b.distanceMi ?? 999);
        case 'rating': return (b.store?.ratingAvg ?? 0) - (a.store?.ratingAvg ?? 0);
        default: return b.pct - a.pct;
      }
    });
    return list;
  });

  toggleFilter(f: string) {
    const list = this.filters();
    this.filters.set(list.includes(f) ? list.filter(x => x !== f) : [...list, f]);
  }

  requestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { this.userLoc.set({ lat: pos.coords.latitude, lng: pos.coords.longitude }); this.recomputeDistance(); if (this.sort() === 'discount') this.sort.set('distance'); },
      () => { /* permission denied — silently keep city labels */ },
      { timeout: 8000 },
    );
  }
  private recomputeDistance() {
    const loc = this.userLoc();
    if (!loc) return;
    this.allVms.set(this.allVms().map(vm => ({
      ...vm,
      distanceMi: vm.store?.latitude != null && vm.store?.longitude != null
        ? this.haversine(loc.lat, loc.lng, vm.store.latitude, vm.store.longitude) : vm.distanceMi,
    })));
  }
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8, toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private go(vm: DealVM) {
    if (vm.store?.slug) this.router.navigate(['/restaurants', vm.store.slug]);
    else this.router.navigate(['/home']);
  }
  viewDeal(vm: DealVM) { this.go(vm); }
  orderNow(vm: DealVM) { this.go(vm); }
}
