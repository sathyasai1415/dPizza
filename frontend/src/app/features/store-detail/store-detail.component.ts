import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { Store, MenuItem, Deal, PizzaOptionsResponse, Topping } from '../../shared/models';

type TabId = 'menu' | 'deals' | 'info';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div *ngIf="loadingStore()" class="flex justify-center py-24">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-red"></div>
    </div>

    <div *ngIf="!loadingStore() && store()" class="space-y-6 max-w-4xl mx-auto">

      <!-- Store Header banner -->
      <div class="relative rounded-3xl overflow-hidden p-6 sm:p-8"
        [style.background]="store()?.brandColor ? store()?.brandColor : 'linear-gradient(135deg, #1f1225 0%, #110915 100%)'">
        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] bg-[#0A0D18]/80 flex items-center justify-center text-4xl sm:text-5xl shadow-xl">
              {{ store()?.emoji }}
            </div>
            <div>
              <h2 class="text-2xl sm:text-3xl font-black text-brand-black leading-tight">{{ store()?.name }}</h2>
              <p class="text-xs sm:text-sm text-brand-black mt-1">{{ store()?.neighborhood || store()?.city }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <span class="bg-brand-white border border-brand-black px-3 py-1.5 rounded-xl text-xs font-bold text-brand-black">
              ★ {{ store()?.ratingAvg | number:'1.1-1' }} ({{ store()?.ratingCount }} reviews)
            </span>
            <span class="bg-brand-white border border-brand-black px-3 py-1.5 rounded-xl text-xs font-bold text-brand-black">
              ⏱️ {{ store()?.averageEtaMinutes || 25 }} mins
            </span>
          </div>
        </div>
      </div>

      <!-- Tab selectors -->
      <div class="flex gap-4 border-b border-brand-black pb-1">
        <button (click)="setTab('menu')" [class]="tabCls('menu')">Menu</button>
        <button (click)="setTab('deals')" [class]="tabCls('deals')">Deals</button>
        <button (click)="setTab('info')" [class]="tabCls('info')">Store Info</button>
      </div>

      <!-- TAB CONTENTS -->
      <div [ngSwitch]="activeTab()">

        <!-- MENU TAB -->
        <div *ngSwitchCase="'menu'" class="space-y-8">
          <div *ngIf="loadingMenu()" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
          </div>
          <div *ngIf="!loadingMenu() && menuItems().length === 0" class="text-center py-12 text-brand-black">
            <p>No menu items available for this store.</p>
          </div>

          <div *ngIf="!loadingMenu() && menuItems().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div *ngFor="let item of menuItems()" class="clay p-4 rounded-2xl flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-brand-red text-brand-white flex items-center justify-center text-2xl shrink-0">
                  {{ item.itemType === 'PIZZA' ? '🍕' : item.itemType === 'SIDE' ? '🥖' : item.itemType === 'DRINK' ? '🥤' : '🍰' }}
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-sm text-brand-black truncate">{{ item.name }}</h4>
                  <p class="text-xs text-brand-black mt-1 line-clamp-1">{{ item.description }}</p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1.5 shrink-0">
                <span class="text-sm font-black text-brand-black">{{ item.basePrice | currency }}</span>
                <button (click)="openCustomize(item)"
                  class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-brand-red text-brand-white hover:bg-brand-red text-brand-white transition">
                  {{ item.itemType === 'PIZZA' ? 'Customize' : 'Add' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- DEALS TAB -->
        <div *ngSwitchCase="'deals'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngIf="loadingDeals()" class="flex justify-center py-12 col-span-2">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
          </div>
          <div *ngIf="!loadingDeals() && deals().length === 0" class="text-center py-12 text-brand-black col-span-2">
            <p>No active deals for this store.</p>
          </div>
          <div *ngFor="let deal of deals()" class="border border-green-500/20 rounded-2xl p-4">
            <span class="text-[9px] font-black text-brand-green bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase">{{ deal.deliveryType || 'Active Deal' }}</span>
            <h4 class="text-sm font-black text-brand-black mt-1.5">{{ deal.title }}</h4>
            <p class="text-[11px] text-brand-black mt-1">{{ deal.description }}</p>
            <div class="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-brand-black">
              <span class="text-xs text-brand-black">Price:</span>
              <span class="text-sm font-black text-brand-green">{{ deal.discountedPrice | currency }}</span>
            </div>
          </div>
        </div>

        <!-- INFO TAB -->
        <div *ngSwitchCase="'info'" class="clay p-6 rounded-2xl space-y-4">
          <div><h4 class="text-xs font-bold text-brand-black uppercase">Description</h4><p class="text-sm text-brand-black mt-1 leading-relaxed">{{ store()?.description }}</p></div>
          <div><h4 class="text-xs font-bold text-brand-black uppercase">Address</h4><p class="text-sm text-brand-black mt-1">{{ store()?.addressLine }}, {{ store()?.city }}, {{ store()?.state }}</p></div>
          <div><h4 class="text-xs font-bold text-brand-black uppercase">Phone Number</h4><p class="text-sm text-brand-black mt-1">{{ store()?.phone }}</p></div>
        </div>
      </div>
    </div>

    <!-- ============ CUSTOMIZATION DRAWER ============ -->
    <div *ngIf="customizing() as item" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-brand-white backdrop-blur-sm" (click)="closeCustomize()"></div>

      <div class="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto glass rounded-t-[32px] sm:rounded-[32px] border border-brand-black bg-[#0d0810]/95">
        <!-- header -->
        <div class="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 border-b border-brand-black bg-[#0d0810]/95">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-brand-black">Customize at {{ store()?.name }}</p>
            <h3 class="text-lg font-black text-brand-black leading-tight">{{ item.name }}</h3>
            <p class="text-xs text-brand-black">Base {{ item.basePrice | currency }} · small changes only</p>
          </div>
          <button (click)="closeCustomize()" class="text-brand-black hover:text-brand-black text-xl leading-none">✕</button>
        </div>

        <div class="p-5 space-y-5">
          @if (loadingOptions()) {
            <div class="flex justify-center py-8"><div class="animate-spin rounded-full h-7 w-7 border-t-2 border-brand-red"></div></div>
          }

          <!-- ADD toppings (only what this restaurant offers) -->
          @if (addable().length > 0) {
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-brand-black mb-2">Add ingredients</p>
              <div class="flex flex-wrap gap-2">
                @for (t of addable(); track t.name) {
                  <div class="flex items-center rounded-xl overflow-hidden border" [class]="isAdded(t.name) ? 'border-brand-red' : 'border-brand-black'">
                    <button (click)="toggleAdd(t.name)" [class]="'px-3 py-2 text-xs font-bold transition ' + (isAdded(t.name) ? 'bg-brand-red text-brand-white' : 'bg-brand-white text-brand-black hover:bg-brand-white')">
                      {{ isAdded(t.name) ? '✓' : '+' }} {{ t.name }}
                      @if (t.price) { <span class="text-[9px] opacity-70 ml-0.5">+{{ t.price | currency }}</span> }
                    </button>
                    @if (isAdded(t.name)) {
                      <button (click)="toggleExtra(t.name)" [class]="'px-2 py-2 text-[10px] font-black transition ' + (isExtra(t.name) ? 'bg-brand-orange text-brand-white' : 'bg-brand-white text-brand-black hover:text-brand-black')" title="Extra serving">Extra</button>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- REMOVE ingredients -->
          @if (removable().length > 0) {
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-brand-black mb-2">Remove ingredients</p>
              <div class="flex flex-wrap gap-2">
                @for (t of removable(); track t) {
                  <button (click)="toggleRemove(t)" [class]="'px-3 py-2 rounded-xl text-xs font-bold transition ' + (isRemoved(t) ? 'bg-brand-white text-brand-black line-through' : 'bg-brand-white text-brand-black hover:bg-brand-white border border-brand-black')">
                    {{ isRemoved(t) ? 'No ' + t : t }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- SAUCE change (if restaurant offers sauces) -->
          @if (sauces().length > 0) {
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-brand-black mb-2">Sauce (optional change)</p>
              <div class="flex flex-wrap gap-2">
                @for (s of sauces(); track s.name) {
                  <button (click)="chooseSauce(s.name)" [class]="'px-3 py-2 rounded-xl text-xs font-bold transition ' + (chosenSauce() === s.name ? 'bg-brand-red text-brand-white' : 'bg-brand-white text-brand-black hover:bg-brand-white border border-brand-black')">{{ s.name }}</button>
                }
              </div>
            </div>
          }

          @if (!loadingOptions() && addable().length === 0 && removable().length === 0 && sauces().length === 0) {
            <p class="text-xs text-brand-black">This item has no customization options — add it as-is.</p>
          }

          <!-- Quantity -->
          <div class="flex items-center justify-between">
            <p class="text-xs font-black uppercase tracking-widest text-brand-black">Quantity</p>
            <div class="flex items-center gap-3">
              <button (click)="setQty(qty() - 1)" class="w-8 h-8 rounded-lg bg-brand-white border border-brand-black text-brand-black hover:bg-brand-white">−</button>
              <span class="text-brand-black font-black w-6 text-center">{{ qty() }}</span>
              <button (click)="setQty(qty() + 1)" class="w-8 h-8 rounded-lg bg-brand-white border border-brand-black text-brand-black hover:bg-brand-white">+</button>
            </div>
          </div>

          <!-- SUMMARY -->
          <div class="clay-soft rounded-2xl p-4 border border-brand-black space-y-2">
            <p class="text-xs font-black uppercase tracking-widest text-brand-black">Your order</p>
            <div class="flex justify-between text-sm"><span class="text-brand-black">{{ item.name }}</span><span class="text-brand-black">{{ item.basePrice | currency }}</span></div>
            @for (c of addedSummary(); track c.name) {
              <div class="flex justify-between text-xs"><span class="text-brand-green">+ {{ c.label }}</span><span class="text-brand-green">+{{ c.price | currency }}</span></div>
            }
            @for (r of removedSummary(); track r) {
              <div class="flex justify-between text-xs"><span class="text-brand-black">− No {{ r }}</span><span class="text-brand-black">—</span></div>
            }
            @if (chosenSauce()) {
              <div class="flex justify-between text-xs"><span class="text-brand-black">↻ {{ chosenSauce() }} sauce</span><span class="text-brand-black">—</span></div>
            }
            <div class="flex justify-between pt-2 border-t border-brand-black">
              <span class="text-brand-black font-bold text-sm">Total{{ qty() > 1 ? ' × ' + qty() : '' }}</span>
              <span class="text-xl font-black text-brand-orange">{{ totalPrice() | currency }}</span>
            </div>
          </div>

          @if (addError()) { <p class="text-xs text-brand-red font-bold">⚠️ {{ addError() }}</p> }

          <div class="grid grid-cols-2 gap-3">
            <button (click)="confirmAdd(false)" [disabled]="submitting()" class="py-3.5 rounded-2xl font-black text-brand-black text-sm bg-brand-white border border-brand-black hover:bg-brand-white transition disabled:opacity-50">
              {{ submitting() ? '…' : '🛒 Add to Cart' }}
            </button>
            <button (click)="confirmAdd(true)" [disabled]="submitting()" class="py-3.5 rounded-2xl font-black text-brand-black text-sm hover:hover:transition disabled:opacity-50">
              {{ submitting() ? '…' : 'Checkout →' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StoreDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly restaurantService = inject(RestaurantService);
  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);

  store = signal<Store | null>(null);
  menuItems = signal<MenuItem[]>([]);
  deals = signal<Deal[]>([]);
  options = signal<PizzaOptionsResponse | null>(null);

  activeTab = signal<TabId>('menu');
  loadingStore = signal(true);
  loadingMenu = signal(false);
  loadingDeals = signal(false);
  loadingOptions = signal(false);

  // customization drawer state
  customizing = signal<MenuItem | null>(null);
  added = signal<string[]>([]);
  extras = signal<string[]>([]);
  removed = signal<string[]>([]);
  chosenSauce = signal<string>('');
  qty = signal(1);
  submitting = signal(false);
  addError = signal('');

  // Ingredients this restaurant offers, grouped from its real pizza-options catalog.
  private available = (cat: Topping['category'][]) =>
    (this.options()?.toppings ?? []).filter(t => t.available && cat.includes(t.category));
  addable = computed<Topping[]>(() => this.available(['MEAT', 'VEGGIE', 'CHEESE']));
  sauces = computed<Topping[]>(() => this.available(['SAUCE']));
  // Removable = the veggie/cheese ingredients the restaurant offers (data-driven, no hardcoding).
  removable = computed<string[]>(() => this.available(['VEGGIE', 'CHEESE']).map(t => t.name));

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) this.loadStoreDetails(slug);
    });
  }

  loadStoreDetails(slug: string) {
    this.loadingStore.set(true);
    this.restaurantService.getRestaurantBySlug(slug).subscribe({
      next: (store) => {
        this.store.set(store);
        this.loadingStore.set(false);
        this.loadMenu(store.id);
        this.loadDeals(store.id);
        this.loadOptions(store.id);
      },
      error: () => this.loadingStore.set(false)
    });
  }

  loadMenu(storeId: string) {
    this.loadingMenu.set(true);
    this.menuService.getMenuItems(storeId).subscribe({
      next: items => { this.menuItems.set(items); this.loadingMenu.set(false); },
      error: () => this.loadingMenu.set(false)
    });
  }

  loadDeals(storeId: string) {
    this.loadingDeals.set(true);
    this.restaurantService.getRestaurantDeals(storeId).subscribe({
      next: deals => { this.deals.set(deals); this.loadingDeals.set(false); },
      error: () => this.loadingDeals.set(false)
    });
  }

  loadOptions(storeId: string) {
    this.loadingOptions.set(true);
    this.menuService.getPizzaOptions(storeId).subscribe({
      next: opts => { this.options.set(opts); this.loadingOptions.set(false); },
      error: () => this.loadingOptions.set(false)
    });
  }

  setTab(tab: TabId) { this.activeTab.set(tab); }
  tabCls(tab: TabId): string {
    return this.activeTab() === tab
      ? 'border-b-2 border-brand-red pb-2 px-1 text-sm font-black text-brand-black'
      : 'pb-2 px-1 text-sm font-semibold text-brand-black hover:text-brand-black transition';
  }

  // ---- Customization ----
  openCustomize(item: MenuItem) {
    this.customizing.set(item);
    this.added.set([]); this.extras.set([]); this.removed.set([]); this.chosenSauce.set(''); this.qty.set(1);
    this.addError.set('');
  }
  closeCustomize() { this.customizing.set(null); }

  private toppingByName(name: string): Topping | undefined {
    return (this.options()?.toppings ?? []).find(t => t.name === name);
  }
  private toggleIn(sig: ReturnType<typeof signal<string[]>>, name: string) {
    const list = sig();
    sig.set(list.includes(name) ? list.filter(x => x !== name) : [...list, name]);
  }

  isAdded(n: string) { return this.added().includes(n); }
  toggleAdd(n: string) {
    this.toggleIn(this.added, n);
    if (!this.isAdded(n)) this.extras.set(this.extras().filter(x => x !== n));
  }
  isExtra(n: string) { return this.extras().includes(n); }
  toggleExtra(n: string) { this.toggleIn(this.extras, n); }
  isRemoved(n: string) { return this.removed().includes(n); }
  toggleRemove(n: string) { this.toggleIn(this.removed, n); }
  chooseSauce(n: string) { this.chosenSauce.set(this.chosenSauce() === n ? '' : n); }
  setQty(n: number) { this.qty.set(Math.max(1, Math.min(20, n))); }

  private addedPrice(name: string): number {
    const base = this.toppingByName(name)?.price ?? 0;
    return base * (this.isExtra(name) ? 1.5 : 1);
  }
  addedSummary(): { name: string; label: string; price: number }[] {
    return this.added().map(n => ({ name: n, label: (this.isExtra(n) ? 'Extra ' : '') + n, price: this.addedPrice(n) }));
  }
  removedSummary(): string[] { return this.removed(); }

  private unitPrice(): number {
    const base = this.customizing()?.basePrice ?? 0;
    return Number(base) + this.added().reduce((s, n) => s + this.addedPrice(n), 0);
  }
  totalPrice(): number { return this.unitPrice() * this.qty(); }

  private buildNotes(): string {
    const parts: string[] = [];
    if (this.added().length) parts.push('Add: ' + this.added().map(n => (this.isExtra(n) ? 'Extra ' : '') + n).join(', '));
    if (this.removed().length) parts.push('No: ' + this.removed().join(', '));
    if (this.chosenSauce()) parts.push('Sauce: ' + this.chosenSauce());
    return parts.join(' · ');
  }

  confirmAdd(checkout: boolean) {
    const item = this.customizing();
    const store = this.store();
    if (!item || !store) return;
    this.submitting.set(true);
    this.addError.set('');

    const toppings = this.added().map(n => ({
      toppingId: this.toppingByName(n)?.id ?? null,
      toppingName: (this.isExtra(n) ? 'Extra ' : '') + n,
      price: this.addedPrice(n),
    }));

    this.cartService.addToCart({
      restaurantId: store.id,
      menuItemId: item.id,
      itemName: item.name,
      size: null,
      crust: null,
      sauce: this.chosenSauce() || null,
      quantity: this.qty(),
      unitPrice: this.unitPrice(),
      notes: this.buildNotes(),
      toppings,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCustomize();
        this.router.navigate([checkout ? '/checkout' : '/cart']);
      },
      error: (e: any) => {
        this.submitting.set(false);
        this.addError.set(e?.error?.message ?? 'Could not add to cart. Please make sure you are signed in.');
      }
    });
  }
}
