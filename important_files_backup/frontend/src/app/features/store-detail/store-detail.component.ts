import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { Store, MenuItem, Deal } from '../../shared/models';

type TabId = 'menu' | 'deals' | 'info';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingStore()" class="flex justify-center py-24">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500"></div>
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
              <h2 class="text-2xl sm:text-3xl font-black text-white leading-tight">{{ store()?.name }}</h2>
              <p class="text-xs sm:text-sm text-white/70 mt-1">{{ store()?.neighborhood || store()?.city }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <span class="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
              ★ {{ store()?.ratingAvg | number:'1.1-1' }} ({{ store()?.ratingCount }} reviews)
            </span>
            <span class="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
              ⏱️ {{ store()?.averageEtaMinutes || 25 }} mins
            </span>
          </div>
        </div>
      </div>

      <!-- Tab selectors -->
      <div class="flex gap-4 border-b border-white/10 pb-1">
        <button (click)="setTab('menu')"
          [class]="activeTab() === 'menu' ? 'border-b-2 border-red-500 pb-2 px-1 text-sm font-black text-white' : 'pb-2 px-1 text-sm font-semibold text-white/50 hover:text-white transition'">
          Menu
        </button>
        <button (click)="setTab('deals')"
          [class]="activeTab() === 'deals' ? 'border-b-2 border-red-500 pb-2 px-1 text-sm font-black text-white' : 'pb-2 px-1 text-sm font-semibold text-white/50 hover:text-white transition'">
          Deals
        </button>
        <button (click)="setTab('info')"
          [class]="activeTab() === 'info' ? 'border-b-2 border-red-500 pb-2 px-1 text-sm font-black text-white' : 'pb-2 px-1 text-sm font-semibold text-white/50 hover:text-white transition'">
          Store Info
        </button>
      </div>

      <!-- TAB CONTENTS -->
      <div [ngSwitch]="activeTab()">
        
        <!-- MENU TAB -->
        <div *ngSwitchCase="'menu'" class="space-y-8">
          <div *ngIf="loadingMenu()" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
          </div>
          <div *ngIf="!loadingMenu() && menuItems().length === 0" class="text-center py-12 text-white/40">
            <p>No menu items available for this store.</p>
          </div>
          
          <div *ngIf="!loadingMenu() && menuItems().length > 0" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let item of menuItems()"
                class="glass p-4 rounded-2xl flex items-center justify-between gap-4 group">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-2xl shrink-0">
                    {{ item.itemType === 'PIZZA' ? '🍕' : item.itemType === 'SIDE' ? '🥖' : item.itemType === 'DRINK' ? '🥤' : '🍰' }}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-white">{{ item.name }}</h4>
                    <p class="text-xs text-white/40 mt-1 line-clamp-1">{{ item.description }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-sm font-black text-white">{{ item.basePrice | currency }}</span>
                  <button (click)="addItemToCart(item)"
                    class="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center transition">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DEALS TAB -->
        <div *ngSwitchCase="'deals'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngIf="loadingDeals()" class="flex justify-center py-12 col-span-2">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
          </div>
          <div *ngIf="!loadingDeals() && deals().length === 0" class="text-center py-12 text-white/40 col-span-2">
            <p>No active deals for this store.</p>
          </div>

          <div *ngFor="let deal of deals()"
            class="bg-gradient-to-br from-green-950/30 to-emerald-950/20 border border-green-500/20 rounded-2xl p-4">
            <span class="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase">
              {{ deal.deliveryType || 'Active Deal' }}
            </span>
            <h4 class="text-sm font-black text-white mt-1.5">{{ deal.title }}</h4>
            <p class="text-[11px] text-stone-400 mt-1">{{ deal.description }}</p>
            <div class="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-white/5">
              <span class="text-xs text-stone-500">Price:</span>
              <span class="text-sm font-black text-green-400">{{ deal.discountedPrice | currency }}</span>
            </div>
          </div>
        </div>

        <!-- INFO TAB -->
        <div *ngSwitchCase="'info'" class="glass p-6 rounded-2xl space-y-4">
          <div>
            <h4 class="text-xs font-bold text-white/40 uppercase">Description</h4>
            <p class="text-sm text-white/70 mt-1 leading-relaxed">{{ store()?.description }}</p>
          </div>
          <div>
            <h4 class="text-xs font-bold text-white/40 uppercase">Address</h4>
            <p class="text-sm text-white/70 mt-1">{{ store()?.addressLine }}, {{ store()?.city }}, {{ store()?.state }}</p>
          </div>
          <div>
            <h4 class="text-xs font-bold text-white/40 uppercase">Phone Number</h4>
            <p class="text-sm text-white/70 mt-1">{{ store()?.phone }}</p>
          </div>
        </div>

      </div>
    </div>
  `
})
export class StoreDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly restaurantService = inject(RestaurantService);
  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);

  store = signal<Store | null>(null);
  menuItems = signal<MenuItem[]>([]);
  deals = signal<Deal[]>([]);

  activeTab = signal<TabId>('menu');
  loadingStore = signal(true);
  loadingMenu = signal(false);
  loadingDeals = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadStoreDetails(slug);
      }
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
      },
      error: () => {
        this.loadingStore.set(false);
      }
    });
  }

  loadMenu(storeId: string) {
    this.loadingMenu.set(true);
    this.menuService.getMenuItems(storeId).subscribe(items => {
      this.menuItems.set(items);
      this.loadingMenu.set(false);
    });
  }

  loadDeals(storeId: string) {
    this.loadingDeals.set(true);
    this.restaurantService.getRestaurantDeals(storeId).subscribe(deals => {
      this.deals.set(deals);
      this.loadingDeals.set(false);
    });
  }

  setTab(tab: TabId) {
    this.activeTab.set(tab);
  }

  addItemToCart(item: MenuItem) {
    this.cartService.addToCart({
      store_id: item.restaurantId,
      store_name: this.store()?.name || 'Local Store',
      item_name: item.name,
      quantity: 1,
      price_per_item: item.basePrice,
      total_price: item.basePrice,
      delivery_type: 'pickup'
    });
  }
}
