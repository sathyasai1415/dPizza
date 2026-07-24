import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChainCompareService } from '../../core/services/chain-compare.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Quote, DeliveryProviderOption } from '../../shared/models';

@Component({
  selector: 'app-comparison-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="cmp">

      @if (successMsg()) {
        <div class="banner ok">🎉 {{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="banner err">⚠️ {{ errorMsg() }}</div>
      }

      <!-- Subject: the pizza being compared -->
      <div class="subject">
        <div class="th">🍕</div>
        <div class="info">
          <span class="lbl">Comparing</span>
          <h2>{{ (buildConfig()?.size || 'Large') }} Pizza</h2>
          <p>{{ buildConfig()?.crust || 'Hand Tossed' }} · same pie, {{ quotes().length }} pizzerias</p>
        </div>
        <button class="edit" (click)="editPizza()">Edit</button>
      </div>

      <!-- Sort -->
      @if (!loading() && quotes().length > 0) {
        <div class="sort">
          <button [class.on]="sortMode() === 'cheap'" (click)="setSort('cheap')">
            <svg viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Cheapest
          </button>
          <button [class.on]="sortMode() === 'fast'" (click)="setSort('fast')">
            <svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg> Fastest
          </button>
        </div>
        <div class="count">{{ quotes().length }} pizzerias near {{ city() }}</div>
      }

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      <!-- Quote list -->
      @if (!loading() && sortedQuotes().length > 0) {
        <div class="list">
          @for (q of sortedQuotes(); track q.chainId; let i = $index) {
            <div class="qcard" [class.best]="i === 0">
              <div class="qhd">
                <span class="dot" [style.background]="q.logoColor || '#E5462F'">{{ q.chainName.charAt(0) }}</span>
                <div class="qn">
                  <h5>{{ q.chainName }}</h5>
                  <div class="meta">
                    <span class="star">★ {{ q.rating | number:'1.1-1' }}</span> · {{ q.distance }}
                  </div>
                </div>
                @if (isCheapest(q)) {
                  <span class="badge">🔥 Best Price</span>
                } @else if (isFastest(q)) {
                  <span class="badge fast">⚡ Fastest</span>
                }
              </div>

              <div class="qft">
                <div class="etawrap">
                  <div class="eta">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    {{ etaMin(q) }}–{{ etaMax(q) }} min
                  </div>
                  <div class="sub">incl. {{ bestOption(q)?.priceBreakdown?.deliveryFee | currency }} delivery</div>
                </div>
                <div class="pr">
                  <small>Total</small>
                  <span class="t">{{ quoteTotal(q) | currency }}</span>
                </div>
              </div>

              @if (isCheapest(q) && quotes().length > 1) {
                <div class="save">🏆 Cheapest here — you save {{ (maxTotal() - minTotal()) | currency }} vs the priciest</div>
              }

              @if (bestOption(q)) {
                <button class="order" (click)="placeOrder(q, bestOption(q)!)" [disabled]="submitting()">
                  {{ submitting() ? 'Placing order…' : 'Order from ' + q.chainName }}
                </button>
              }
            </div>
          }
        </div>
      }

      @if (!loading() && quotes().length === 0) {
        <div class="empty">
          <p class="ico">🍕</p>
          <p class="t">No pizzerias match this pizza yet</p>
          <p class="s">Try editing your pizza or widening your area.</p>
          <button class="edit-lg" (click)="editPizza()">Edit pizza</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{
      --o:#FF6A13; --o2:#F0530A; --o-soft:#FFE7D3;
      --cream:#FBF4EA; --surface:#FFFFFF; --warm:#F2E9DA;
      --ink:#241C15; --muted:#9B8B77; --faint:#C9BBA8;
      --espresso:#20140C; --tomato:#E5462F; --gold:#F6A623; --basil:#4E9B5A;
      --line:rgba(36,28,21,.10);
      display:block; min-height:100%; background:var(--cream); color:var(--ink);
      font-family:"Plus Jakarta Sans", ui-rounded, system-ui, sans-serif;
    }
    .cmp{max-width:640px; margin:0 auto; padding:18px 18px 32px; display:flex; flex-direction:column; gap:14px;}
    .banner{border-radius:14px; padding:13px 16px; font-weight:700; font-size:13.5px; text-align:center;}
    .banner.ok{background:rgba(78,155,90,.14); color:#2f7d43;}
    .banner.err{background:rgba(229,70,47,.12); color:var(--tomato);}

    .subject{display:flex; align-items:center; gap:13px; padding:15px 16px; border-radius:20px;
      background:radial-gradient(120% 130% at 88% 12%, #35251a 0%, var(--espresso) 62%); color:#fff;}
    .subject .th{width:52px; height:52px; border-radius:14px; background:radial-gradient(circle at 50% 40%,#FFF0DC,#FBE7CE);
      display:grid; place-items:center; font-size:26px; flex:none;}
    .subject .lbl{font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--gold);}
    .subject h2{font-weight:800; font-size:18px; letter-spacing:-.02em; margin:3px 0 2px;}
    .subject p{font-size:11.5px; color:rgba(255,255,255,.64); font-weight:600;}
    .subject .edit{margin-left:auto; flex:none; background:rgba(255,255,255,.12); color:#fff; border:none;
      padding:9px 16px; border-radius:11px; font-weight:800; font-size:12.5px; cursor:pointer;}
    .subject .edit:hover{background:rgba(255,255,255,.2);}

    .sort{display:flex; gap:8px; background:var(--warm); padding:6px; border-radius:14px;}
    .sort button{flex:1; padding:11px; border-radius:10px; border:none; background:none; font-weight:700; font-size:13.5px;
      color:var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:.16s; font-family:inherit;}
    .sort button svg{width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round;}
    .sort button.on{background:var(--surface); color:var(--ink); box-shadow:0 6px 14px -8px rgba(120,70,20,.35);}
    .sort button.on svg{stroke:var(--o);}
    .count{font-size:11.5px; font-weight:700; color:var(--muted); padding:0 2px;}

    .loading{display:grid; place-items:center; padding:48px 0;}
    .spinner{width:34px; height:34px; border-radius:50%; border:3px solid var(--warm); border-top-color:var(--o); animation:spin .8s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg)}}

    .list{display:flex; flex-direction:column; gap:12px;}
    .qcard{background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:15px;
      box-shadow:0 6px 16px -14px rgba(120,70,20,.5); transition:transform .18s, box-shadow .18s, border-color .18s;}
    .qcard:hover{transform:translateY(-2px); box-shadow:0 14px 26px -16px rgba(120,70,20,.55);}
    .qcard.best{border-color:var(--o); border-width:1.6px; box-shadow:0 16px 30px -16px rgba(240,83,10,.5);}
    .qhd{display:flex; align-items:center; gap:11px; margin-bottom:13px;}
    .dot{width:40px; height:40px; border-radius:12px; display:grid; place-items:center; color:#fff; font-weight:800; font-size:17px;
      flex:none; box-shadow:0 6px 12px -6px rgba(0,0,0,.35); text-transform:uppercase;}
    .qn{flex:1; min-width:0;}
    .qn h5{font-weight:800; font-size:15px; letter-spacing:-.01em;}
    .qn .meta{font-size:11.5px; color:var(--muted); font-weight:600; margin-top:2px;}
    .qn .meta .star{color:var(--gold); font-weight:800;}
    .badge{font-size:9.5px; font-weight:800; letter-spacing:.03em; text-transform:uppercase; padding:6px 10px; border-radius:999px;
      white-space:nowrap; background:var(--o-soft); color:var(--o2); flex:none;}
    .badge.fast{background:#FBEAC7; color:#A96B0C;}
    .qft{display:flex; align-items:flex-end; justify-content:space-between; padding-top:13px; border-top:1px solid var(--line);}
    .eta{display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:700; color:var(--ink);}
    .eta svg{width:14px; height:14px; fill:none; stroke:var(--muted); stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round;}
    .etawrap .sub{font-size:10.5px; color:var(--muted); font-weight:600; margin-top:3px;}
    .pr{display:flex; flex-direction:column; align-items:flex-end; flex:none;}
    .pr small{font-size:10px; color:var(--muted); font-weight:800; text-transform:uppercase; letter-spacing:.05em;}
    .pr .t{font-weight:800; font-size:22px; line-height:1; margin-top:2px;}
    .save{margin-top:12px; font-size:11px; font-weight:700; color:#2f7d43; background:rgba(78,155,90,.12);
      padding:9px 12px; border-radius:11px;}
    .order{margin-top:13px; width:100%; padding:14px; border-radius:14px; border:none; cursor:pointer;
      background:linear-gradient(180deg,#FF7A22,#F0530A); color:#fff; font-weight:800; font-size:14.5px;
      box-shadow:0 12px 22px -12px rgba(240,83,10,.6); font-family:inherit; transition:opacity .15s;}
    .order:hover{opacity:.94;}
    .order:disabled{opacity:.55; cursor:default;}

    .empty{text-align:center; padding:46px 20px; color:var(--muted);}
    .empty .ico{font-size:44px;}
    .empty .t{font-weight:800; font-size:17px; color:var(--ink); margin-top:10px;}
    .empty .s{font-size:13px; margin-top:6px;}
    .empty .edit-lg{margin-top:16px; background:linear-gradient(180deg,#FF7A22,#F0530A); color:#fff; border:none;
      padding:12px 22px; border-radius:13px; font-weight:800; cursor:pointer; font-family:inherit;}

    button:focus-visible{outline:2px solid var(--o); outline-offset:2px;}
    @media (prefers-reduced-motion:reduce){ .qcard{transition:none} .spinner{animation-duration:1.4s} }
  `]
})
export class ComparisonCardsComponent implements OnInit {
  private readonly chainCompareService = inject(ChainCompareService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);

  quotes = signal<Quote[]>([]);
  loading = signal(false);
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  buildConfig = signal<any>(null);
  sortMode = signal<'cheap' | 'fast'>('cheap');
  city = signal<string>('you');

  // ---- Derived comparison data ----
  sortedQuotes = computed(() => {
    const list = [...this.quotes()];
    const mode = this.sortMode();
    return list.sort((a, b) =>
      mode === 'fast'
        ? (this.quoteEta(a) - this.quoteEta(b)) || (this.quoteTotal(a) - this.quoteTotal(b))
        : (this.quoteTotal(a) - this.quoteTotal(b)) || (this.quoteEta(a) - this.quoteEta(b))
    );
  });

  minTotal = computed(() => this.quotes().length ? Math.min(...this.quotes().map(q => this.quoteTotal(q))) : 0);
  maxTotal = computed(() => this.quotes().length ? Math.max(...this.quotes().map(q => this.quoteTotal(q))) : 0);
  minEta = computed(() => this.quotes().length ? Math.min(...this.quotes().map(q => this.quoteEta(q))) : 0);

  bestOption(q: Quote): DeliveryProviderOption | null {
    if (!q.deliveryOptions?.length) return null;
    return q.deliveryOptions.reduce((a, b) => a.priceBreakdown.grandTotal <= b.priceBreakdown.grandTotal ? a : b);
  }
  quoteTotal(q: Quote): number {
    const o = this.bestOption(q);
    return o ? o.priceBreakdown.grandTotal : (q.basePrice + q.toppingsCost);
  }
  quoteEta(q: Quote): number {
    if (!q.deliveryOptions?.length) return 30;
    return Math.min(...q.deliveryOptions.map(o => o.estimatedTimeMin));
  }
  etaMin(q: Quote): number { return this.quoteEta(q); }
  etaMax(q: Quote): number {
    if (!q.deliveryOptions?.length) return this.quoteEta(q) + 10;
    return Math.max(...q.deliveryOptions.map(o => o.estimatedTimeMax));
  }
  isCheapest(q: Quote): boolean { return this.quoteTotal(q) === this.minTotal(); }
  isFastest(q: Quote): boolean { return !this.isCheapest(q) && this.quoteEta(q) === this.minEta(); }

  setSort(mode: 'cheap' | 'fast') { this.sortMode.set(mode); }

  ngOnInit() {
    const rawConfig = localStorage.getItem('mislice_current_build');
    if (rawConfig) {
      try { this.buildConfig.set(JSON.parse(rawConfig)); }
      catch (e) { console.error('Failed to parse build config', e); }
    }
    const c = localStorage.getItem('mislice_selected_city');
    if (c && c !== 'All') this.city.set(c);
    this.updateQuotes();
  }

  editPizza() { this.router.navigate(['/builder']); }

  updateQuotes() {
    this.loading.set(true);
    const cfg = this.buildConfig() || {};
    const apiConfig = {
      size: cfg.size || 'Large',
      crust: cfg.crust || 'Hand Tossed',
      sauce: cfg.sauce || 'Robust Inspired Tomato Sauce',
      cheese: cfg.cheeses || ['Mozzarella'],
      meats: cfg.meats || [],
      veggies: cfg.veggies || [],
      extras: [],
      quantity: cfg.quantity || 1
    };
    this.chainCompareService.comparePizzas(apiConfig, 'delivery').subscribe({
      next: (quotes) => { this.quotes.set(quotes); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMsg.set('Could not load live prices. Please try again.'); }
    });
  }

  placeOrder(quote: Quote, option: DeliveryProviderOption): void {
    this.submitting.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    this.restaurantService.getRestaurants().subscribe({
      next: (stores) => {
        const matched = stores.find(s =>
          s.name.toLowerCase().includes(quote.chainName.toLowerCase()) ||
          quote.chainName.toLowerCase().includes(s.name.toLowerCase())
        );
        if (!matched) {
          this.submitting.set(false);
          this.errorMsg.set(`Unable to find a registered restaurant for ${quote.chainName}.`);
          return;
        }
        const cfg = this.buildConfig() || {};
        const toppings = [...(cfg.meats || []), ...(cfg.veggies || []), ...(cfg.cheeses || [])];
        const mappedToppings = toppings.map(t => ({ toppingId: null, toppingName: t, price: 1.25 }));

        const cartReq = {
          restaurantId: matched.id,
          menuItemId: null,
          itemName: 'Comparison Custom Pizza',
          size: cfg.size || 'Large',
          crust: cfg.crust || 'Hand Tossed',
          sauce: cfg.sauce || 'Robust Inspired Tomato Sauce',
          quantity: cfg.quantity || 1,
          unitPrice: quote.basePrice + quote.toppingsCost,
          notes: `Comparison quote via ${option.providerName}.`,
          toppings: mappedToppings
        };

        this.cartService.addToCart(cartReq).subscribe({
          next: () => {
            this.orderService.placeOrder({
              deliveryType: 'STORE_DELIVERY',
              deliveryAddress: 'Detroit, MI',
              deliveryNotes: `Provider: ${option.providerName}`,
              tip: 0,
              paymentMethod: 'CASH',
            }).subscribe({
              next: (order) => {
                this.submitting.set(false);
                this.successMsg.set(`Order #${order.orderNumber} placed at ${quote.chainName}!`);
              },
              error: (e: any) => {
                this.submitting.set(false);
                this.errorMsg.set(e?.error?.message ?? 'Failed to place order. Try logging in first.');
              }
            });
          },
          error: (e: any) => {
            this.submitting.set(false);
            this.errorMsg.set(e?.error?.message ?? 'Failed to add pizza to cart. Try logging in first.');
          }
        });
      },
      error: () => {
        this.submitting.set(false);
        this.errorMsg.set('Failed to connect to restaurant listings.');
      }
    });
  }
}
