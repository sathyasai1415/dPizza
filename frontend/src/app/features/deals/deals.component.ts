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
    <div class="deals">
      <!-- Hero -->
      <div class="hero">
        <span class="pill">🔥 Live Michigan Deals</span>
        <h1>Deals &amp; Offers</h1>
        <p>The best pizza deals from local Michigan pizzerias — right now.</p>
        <button class="loc" (click)="requestLocation()">{{ userLoc() ? '📍 Near you · on' : '📍 Use my location' }}</button>
      </div>

      <!-- Category chips (scroll contained) -->
      <div class="chips">
        @for (c of categories; track c.id) {
          @if (c.id === 'all' || countFor(c) > 0) {
            <button [class.on]="activeCat() === c.id" (click)="activeCat.set(c.id)">
              {{ c.label }}<span class="n">{{ c.id === 'all' ? vms().length : countFor(c) }}</span>
            </button>
          }
        }
      </div>

      <!-- Sort -->
      <select class="sortsel" [ngModel]="sort()" (ngModelChange)="sort.set($any($event))">
        <option value="discount">Sort: Best Discount</option>
        <option value="expiring">Expiring Soon</option>
        <option value="price">Price: Low → High</option>
        <option value="distance">Nearest</option>
        <option value="rating">Top Rated</option>
      </select>

      <!-- Filter chips (scroll contained) -->
      <div class="fchips">
        <button [class.on]="filters().includes('free_delivery')" (click)="toggleFilter('free_delivery')">🛵 Free Delivery</button>
        <button [class.on]="filters().includes('favourites')" (click)="toggleFilter('favourites')">❤️ Favourites</button>
        <button [class.on]="filters().includes('rating')" (click)="toggleFilter('rating')">★ 4.5+ Stars</button>
        <button [class.on]="filters().includes('open_now')" (click)="toggleFilter('open_now')">🟢 Open Now</button>
        <button [class.on]="filters().includes('under10')" (click)="toggleFilter('under10')">💰 Under $10</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!loading() && visible().length === 0) {
        <div class="empty">
          <p class="ico">🏷️</p>
          <p class="t">No deals match this view</p>
          <p class="s">Try a different category or clear your filters — new offers post all the time.</p>
        </div>
      }

      @if (!loading() && visible().length > 0) {
        <div class="dgrid">
          @for (vm of visible(); track vm.deal.id) {
            <div class="dcard">
              <div class="dbanner" [style.background]="vm.store?.brandColor || 'linear-gradient(135deg,#1E053D,#0E011E)'">
                <img *ngIf="vm.deal.imageUrl" [src]="vm.deal.imageUrl" alt="" />
                <span *ngIf="!vm.deal.imageUrl" class="pie">🍕</span>
                @if (vm.pct > 0) { <span class="bsave">SAVE {{ vm.pct }}%</span> }
                <span class="btime">{{ timeLeft(vm.deal) }}</span>
              </div>

              <div class="dbody">
                <div class="rrow">
                  <span class="remoji">{{ vm.store?.emoji || '🏪' }}</span>
                  <div class="rn">
                    <p class="name">{{ vm.store?.name || 'Local Pizzeria' }}</p>
                    <p class="city">{{ vm.store?.city || 'Local Area' }}</p>
                  </div>
                  <span class="rate">★ {{ (vm.store?.ratingAvg || 4.5) | number:'1.1-1' }}</span>
                </div>

                <div class="dinfo">
                  <p class="dtitle">{{ vm.deal.title }}</p>
                  <p class="ddesc">{{ vm.deal.description }}</p>
                </div>

                <div class="dprice">
                  <div class="prow">
                    <span class="now">{{ (vm.deal.discountedPrice ?? vm.deal.originalPrice) | currency }}</span>
                    @if (vm.deal.originalPrice && vm.deal.originalPrice > (vm.deal.discountedPrice ?? 0)) {
                      <span class="was">{{ vm.deal.originalPrice | currency }}</span>
                    }
                  </div>
                  @if (vm.savings > 0) {
                    <span class="savepill">You save {{ vm.savings | currency }}</span>
                  }
                </div>

                <div class="meta">
                  <div class="mi"><span class="e">⏱️</span><span class="v">{{ vm.store?.averageEtaMinutes || 25 }}m</span></div>
                  <div class="mi"><span class="e">🛵</span><span class="v">{{ (vm.store?.deliveryFee ?? 0) > 0 ? (vm.store?.deliveryFee | currency) : 'Free' }}</span></div>
                  <div class="mi"><span class="e">📍</span>
                    @if (vm.distanceMi != null) { <span class="v">{{ vm.distanceMi | number:'1.0-1' }}mi</span> }
                    @else { <span class="v">{{ vm.store?.city || '—' }}</span> }
                  </div>
                </div>

                <div class="dactions">
                  <button class="details" (click)="viewDeal(vm)">Details</button>
                  <button class="order" (click)="orderNow(vm)">Order</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host{
      --o:#FF8A00; --gold:#D4AF37; --surface:#0A0A0A; --warm:#141414;
      --ink:#FFFFFF; --muted:#9C9C9C; --tomato:#E5462F; --basil:#4E9B5A;
      --line:rgba(212,175,55,0.18);
      display:block; min-height:100%; background:transparent; color:var(--ink);
      font-family:"Plus Jakarta Sans", ui-rounded, system-ui, sans-serif;
    }
    .deals{max-width:640px; margin:0 auto; padding:16px 16px 40px; display:flex; flex-direction:column; gap:12px; overflow-x:hidden;}

    .hero{position:relative; overflow:hidden; border-radius:22px; padding:22px 20px;
      background:linear-gradient(135deg,#1E053D 0%,#0E011E 100%); border:1px solid var(--line); box-shadow:0 10px 28px rgba(0,0,0,.45);}
    .hero .pill{display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase;
      color:var(--gold); background:rgba(212,175,55,.12); border:1px solid rgba(212,175,55,.35); padding:6px 12px; border-radius:999px;}
    .hero h1{font-weight:800; font-size:28px; letter-spacing:-.02em; margin:14px 0 6px; color:#fff;}
    .hero p{font-size:13px; color:rgba(255,255,255,.66); font-weight:500; line-height:1.5; max-width:38ch;}
    .hero .loc{margin-top:16px; background:#fff; color:#1a1020; border:none; padding:11px 18px; border-radius:14px; font-weight:800; font-size:13px; cursor:pointer; font-family:inherit;}

    .chips{display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; -webkit-overflow-scrolling:touch;}
    .chips::-webkit-scrollbar{display:none;}
    .chips button{flex:none; white-space:nowrap; padding:9px 15px; border-radius:999px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit;
      background:var(--surface); color:var(--muted); border:1px solid var(--line); transition:.16s;}
    .chips button .n{opacity:.6; margin-left:6px;}
    .chips button.on{background:linear-gradient(180deg,var(--gold),#C8A84A); color:#1a1020; border-color:transparent; font-weight:800;}

    .sortsel{width:100%; background:var(--surface); border:1px solid var(--line); border-radius:13px; padding:12px 15px; font-size:13px; font-weight:700;
      color:#fff; outline:none; cursor:pointer; font-family:inherit;}
    .sortsel:focus{border-color:var(--gold);}
    .sortsel option{background:#141414; color:#fff;}

    .fchips{display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none;}
    .fchips::-webkit-scrollbar{display:none;}
    .fchips button{flex:none; white-space:nowrap; padding:8px 13px; border-radius:11px; font-size:11.5px; font-weight:700; cursor:pointer; font-family:inherit;
      background:var(--surface); color:var(--muted); border:1px solid var(--line); transition:.16s;}
    .fchips button.on{background:var(--tomato); color:#fff; border-color:var(--tomato);}

    .loading{display:grid; place-items:center; padding:56px 0;}
    .spinner{width:34px; height:34px; border-radius:50%; border:3px solid var(--warm); border-top-color:var(--gold); animation:spin .8s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg)}}

    .empty{text-align:center; padding:48px 20px; background:var(--surface); border:1px solid var(--line); border-radius:22px;}
    .empty .ico{font-size:46px;} .empty .t{font-weight:800; font-size:18px; margin-top:10px;} .empty .s{font-size:13px; color:var(--muted); margin-top:6px;}

    .dgrid{display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px;}
    .dcard{background:var(--surface); border:1px solid var(--line); border-radius:20px; overflow:hidden; display:flex; flex-direction:column;
      box-shadow:0 8px 22px -14px rgba(0,0,0,.6); transition:transform .18s, border-color .18s;}
    .dcard:hover{transform:translateY(-3px); border-color:rgba(212,175,55,.5);}
    .dbanner{position:relative; height:150px; display:grid; place-items:center; overflow:hidden;}
    .dbanner img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover;}
    .dbanner .pie{font-size:52px;}
    .bsave{position:absolute; top:12px; left:12px; font-size:11px; font-weight:900; color:#1a1020;
      background:linear-gradient(90deg,var(--gold),#E5BF47); padding:6px 11px; border-radius:999px; box-shadow:0 4px 10px rgba(0,0,0,.35);}
    .btime{position:absolute; top:12px; right:12px; font-size:10.5px; font-weight:700; color:#fff; background:rgba(0,0,0,.6);
      padding:6px 11px; border-radius:999px; border:1px solid rgba(255,255,255,.12); backdrop-filter:blur(3px);}

    .dbody{padding:16px; display:flex; flex-direction:column; gap:13px;}
    .rrow{display:flex; align-items:center; gap:10px;}
    .rrow .remoji{font-size:22px;}
    .rrow .rn{flex:1; min-width:0;}
    .rrow .name{font-size:13.5px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
    .rrow .city{font-size:11px; color:var(--muted); font-weight:600;}
    .rrow .rate{font-size:11.5px; font-weight:800; color:var(--gold); background:rgba(212,175,55,.12); padding:4px 9px; border-radius:9px; flex:none;}

    .dinfo .dtitle{font-size:15px; font-weight:800; color:#fff; line-height:1.25;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;}
    .dinfo .ddesc{font-size:12px; color:var(--muted); font-weight:500; line-height:1.5; margin-top:4px;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;}

    .dprice{display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line);}
    .dprice .prow{display:flex; align-items:baseline; gap:8px;}
    .dprice .now{font-size:26px; font-weight:900; color:var(--o); line-height:1;}
    .dprice .was{font-size:13px; color:rgba(255,255,255,.4); font-weight:600; text-decoration:line-through;}
    .savepill{font-size:11px; font-weight:800; color:var(--basil); background:rgba(78,155,90,.15); border:1px solid rgba(78,155,90,.3); padding:6px 10px; border-radius:9px; white-space:nowrap;}

    .meta{display:grid; grid-template-columns:repeat(3,1fr); gap:8px;}
    .meta .mi{display:flex; flex-direction:column; gap:3px;}
    .meta .e{font-size:16px;}
    .meta .v{font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}

    .dactions{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:2px;}
    .dactions button{padding:12px; border-radius:12px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; cursor:pointer; border:none; font-family:inherit; transition:.16s;}
    .dactions .details{background:var(--warm); color:#fff; border:1px solid var(--line);}
    .dactions .details:hover{border-color:var(--gold); color:var(--gold);}
    .dactions .order{background:linear-gradient(90deg,#FF8A00,#FF6A13); color:#fff; box-shadow:0 8px 16px -8px rgba(255,106,19,.7);}
    .dactions .order:hover{filter:brightness(1.08);}

    button:focus-visible, select:focus-visible{outline:2px solid var(--o); outline-offset:2px;}
    @media (prefers-reduced-motion:reduce){ .dcard{transition:none} .spinner{animation-duration:1.4s} }
  `],
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
      // Open Now logic
      if (f.includes('open_now') && vm.store && !vm.store.acceptingOrders) return false;
      
      // Favourites logic
      if (f.includes('favourites')) {
        const favIds: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
        if (!vm.store || (!favIds.includes(vm.store.id) && !favIds.includes(vm.store.slug))) return false;
      }
      
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
