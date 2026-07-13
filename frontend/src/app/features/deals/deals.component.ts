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
    <div class="w-full space-y-5 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="relative overflow-hidden rounded-[28px] border border-orange-500/40 bg-gradient-to-br from-red-950 to-orange-950 p-6 sm:p-8">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_45%)] pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span class="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-300 border border-orange-400/30">🔥 Live Michigan Deals</span>
            <h1 class="mt-4 text-3xl sm:text-4xl font-black text-white">Deals &amp; Offers</h1>
            <p class="mt-2 text-sm text-orange-100/70">The best pizza deals from restaurants near you — right now.</p>
          </div>
          <button (click)="requestLocation()" class="shrink-0 self-start sm:self-auto text-xs font-bold text-white bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl hover:bg-white/15 transition">
            {{ userLoc() ? '📍 Near you · on' : '📍 Use my location' }}
          </button>
        </div>
      </div>

      <!-- Category chips -->
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        @for (c of categories; track c.id) {
          @if (c.id === 'all' || countFor(c) > 0) {
            <button (click)="activeCat.set(c.id)"
              [class]="'shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap ' + (activeCat() === c.id ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' : 'bg-white/5 text-white/60 hover:text-white border border-white/10')">
              {{ c.label }}<span class="opacity-60 ml-1">{{ c.id === 'all' ? vms().length : countFor(c) }}</span>
            </button>
          }
        }
      </div>

      <!-- Filters + sort -->
      <div class="flex flex-wrap items-center gap-2">
        <button (click)="toggleFilter('delivery')" [class]="fchip(filters().includes('delivery'))">🛵 Delivery</button>
        <button (click)="toggleFilter('pickup')" [class]="fchip(filters().includes('pickup'))">🏬 Pickup</button>
        <button (click)="toggleFilter('under10')" [class]="fchip(filters().includes('under10'))">💰 Under $10</button>
        <button (click)="toggleFilter('rating')" [class]="fchip(filters().includes('rating'))">⭐ 4.5+</button>
        <span class="flex-1"></span>
        <select [ngModel]="sort()" (ngModelChange)="sort.set($any($event))"
          class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500">
          <option class="bg-neutral-900" value="discount">Sort: Best Discount</option>
          <option class="bg-neutral-900" value="expiring">Expiring Soon</option>
          <option class="bg-neutral-900" value="price">Price: Low → High</option>
          <option class="bg-neutral-900" value="distance">Nearest</option>
          <option class="bg-neutral-900" value="rating">Top Rated</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex justify-center py-16"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div></div>

      <!-- Empty -->
      <div *ngIf="!loading() && visible().length === 0" class="glass rounded-3xl p-12 text-center text-white/50">
        <p class="text-4xl mb-3">🏷️</p>
        <p class="font-black text-white mb-1">No deals match this view</p>
        <p class="text-sm">Try a different category or clear your filters — new offers post all the time.</p>
      </div>

      <!-- Deals grid -->
      <div *ngIf="!loading() && visible().length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (vm of visible(); track vm.deal.id) {
          <div class="glass rounded-3xl overflow-hidden flex flex-col hover:border-orange-500/40 border border-white/5 transition group">
            <!-- image / banner -->
            <div class="relative h-32 flex items-center justify-center text-5xl"
              [style.background]="vm.store?.brandColor || 'linear-gradient(135deg,#7f1d1d,#c2410c)'">
              <img *ngIf="vm.deal.imageUrl" [src]="vm.deal.imageUrl" alt="" class="absolute inset-0 w-full h-full object-cover" />
              <span *ngIf="!vm.deal.imageUrl">🍕</span>
              @if (vm.pct > 0) {
                <span class="absolute top-3 left-3 text-[11px] font-black text-white bg-red-600 px-2.5 py-1 rounded-full shadow-lg">SAVE {{ vm.pct }}%</span>
              }
              <span class="absolute top-3 right-3 text-[10px] font-black text-white bg-black/50 backdrop-blur px-2 py-1 rounded-full">{{ timeLeft(vm.deal) }}</span>
            </div>

            <div class="p-4 flex flex-col flex-1">
              <!-- restaurant row -->
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">{{ vm.store?.emoji || '🏪' }}</span>
                <span class="text-sm font-black text-white truncate flex-1">{{ vm.store?.name || 'Local Pizzeria' }}</span>
                <span class="text-[11px] font-bold text-yellow-300">★ {{ (vm.store?.ratingAvg || 4.5) | number:'1.1-1' }}</span>
              </div>

              <p class="text-sm font-bold text-white leading-tight">{{ vm.deal.title }}</p>
              <p class="text-xs text-white/40 mt-0.5 line-clamp-1 flex-1">{{ vm.deal.description }}</p>

              <!-- price -->
              <div class="flex items-baseline gap-2 mt-3">
                @if (vm.deal.originalPrice) { <span class="text-xs text-white/30 line-through">{{ vm.deal.originalPrice | currency }}</span> }
                <span class="text-xl font-black text-orange-400">{{ (vm.deal.discountedPrice ?? vm.deal.originalPrice) | currency }}</span>
                @if (vm.savings > 0) { <span class="text-[11px] font-black text-emerald-400">Save {{ vm.savings | currency }}</span> }
              </div>

              <!-- meta -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-white/40 font-bold">
                <span>⏱️ {{ vm.store?.averageEtaMinutes || 25 }} min</span>
                <span>{{ (vm.store?.deliveryFee ?? 0) > 0 ? ('🛵 ' + (vm.store?.deliveryFee | currency)) : '🛵 Free' }}</span>
                @if (vm.distanceMi != null) { <span>📍 {{ vm.distanceMi | number:'1.1-1' }} mi</span> }
                @else if (vm.store?.city) { <span>📍 {{ vm.store?.city }}</span> }
              </div>

              <!-- actions -->
              <div class="grid grid-cols-2 gap-2 mt-4">
                <button (click)="viewDeal(vm)" class="py-2 rounded-xl text-xs font-black text-white bg-white/5 border border-white/10 hover:bg-white/10 transition">View Deal</button>
                <button (click)="orderNow(vm)" class="py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition">Order Now</button>
              </div>
            </div>
          </div>
        }
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
      if (f.includes('delivery') && !/delivery|store_delivery/i.test(vm.deal.deliveryType || '')) return false;
      if (f.includes('pickup') && !/pickup/i.test(vm.deal.deliveryType || '')) return false;
      if (f.includes('under10') && (vm.deal.discountedPrice ?? 99) >= 10) return false;
      if (f.includes('rating') && (vm.store?.ratingAvg ?? 0) < 4.5) return false;
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
  fchip(active: boolean): string {
    return `px-3 py-2 rounded-xl text-xs font-bold transition ${active ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}`;
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
