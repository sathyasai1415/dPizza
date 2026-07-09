import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Store } from '../../shared/models';

interface Opt { label: string; emoji?: string; price?: number; }

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="w-full pt-2">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
          ✦ Premium Pizza Builder
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Build Your Perfect Pizza</h1>
        <p class="text-white/50 text-sm">Customize your pizza, pick a store, and order instantly.</p>
      </div>

      @if (successMsg()) {
        <div class="glass border border-emerald-500/30 rounded-2xl p-4 mb-6 text-center text-emerald-400 font-bold text-sm">
          ✅ {{ successMsg() }}
        </div>
      }
      @if (errorMsg()) {
        <div class="glass border border-red-500/30 rounded-2xl p-4 mb-6 text-center text-red-400 font-bold text-sm">
          ⚠️ {{ errorMsg() }}
        </div>
      }

      <div class="grid lg:grid-cols-[1fr_minmax(0,380px)] gap-6 items-start">
        <div class="space-y-6">
          <!-- Size -->
          <section class="glass rounded-3xl p-5">
            <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Size</p>
            <div class="grid grid-cols-4 gap-2">
              @for (s of sizes; track s.label) {
                <button (click)="config.size = s.label" [class]="chip(config.size === s.label)">
                  <span class="block text-lg">{{ s.emoji }}</span>
                  <span class="text-[11px] font-bold">{{ s.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Crust -->
          <section class="glass rounded-3xl p-5">
            <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Crust</p>
            <div class="flex flex-wrap gap-2">
              @for (c of crusts; track c.label) {
                <button (click)="config.crust = c.label" [class]="pill(config.crust === c.label)">{{ c.label }}</button>
              }
            </div>
          </section>

          <!-- Sauce -->
          <section class="glass rounded-3xl p-5">
            <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Sauce</p>
            <div class="flex flex-wrap gap-2">
              @for (c of sauces; track c.label) {
                <button (click)="config.sauce = c.label" [class]="pill(config.sauce === c.label)">{{ c.label }}</button>
              }
            </div>
          </section>

          <!-- Toppings -->
          <section class="glass rounded-3xl p-5">
            <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Toppings <span class="text-red-400">({{ config.toppings.length }})</span></p>
            <div class="flex flex-wrap gap-2">
              @for (t of toppings; track t.label) {
                <button (click)="toggleTopping(t.label)" [class]="pill(config.toppings.includes(t.label))">
                  {{ t.emoji }} {{ t.label }}
                </button>
              }
            </div>
          </section>

          <!-- Restaurant Picker -->
          <section class="glass rounded-3xl p-5">
            <p class="text-xs font-black uppercase tracking-widest text-white/40 mb-3">📍 Pick a Restaurant</p>
            @if (loadingStores()) {
              <p class="text-white/40 text-sm">Loading nearby stores...</p>
            } @else if (stores().length === 0) {
              <p class="text-white/40 text-sm">No stores found. Make sure you're logged in.</p>
            } @else {
              <div class="space-y-2">
                @for (store of stores(); track store.id) {
                  <button (click)="selectedStore.set(store)"
                    [class]="'w-full text-left p-3 rounded-2xl transition border ' + (selectedStore()?.id === store.id ? 'border-red-500/60 bg-red-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10')">
                    <p class="text-sm font-bold text-white">{{ store.name }}</p>
                    <p class="text-[11px] text-white/40">{{ store.addressLine }}, {{ store.city }}</p>
                  </button>
                }
              </div>
            }
          </section>
        </div>

        <!-- RIGHT: live preview + checkout -->
        <div class="sticky top-6 space-y-4">
          <div class="glass rounded-[28px] p-6 flex flex-col items-center">
            <div class="relative w-56 h-56 rounded-full flex items-center justify-center mb-4"
              style="background: radial-gradient(circle at 50% 40%, #f4c07a, #e8a34d 60%, #c67f2e 100%); box-shadow: 0 20px 60px -12px rgba(198,127,46,0.6), inset 0 -10px 30px rgba(0,0,0,0.25);">
              <div class="absolute inset-3 rounded-full" style="background: radial-gradient(circle at 50% 45%, #e23b2e, #b91c1c 70%); opacity:.85;"></div>
              <div class="absolute inset-6 rounded-full flex flex-wrap items-center justify-center gap-1 p-4 content-center">
                @for (t of config.toppings; track t) {
                  <span class="text-lg drop-shadow">{{ emojiFor(t) }}</span>
                }
              </div>
            </div>
            <p class="text-white font-black text-lg">{{ config.size }} {{ config.crust }}</p>
            <p class="text-white/50 text-xs mb-1">{{ config.sauce }}</p>
            <p class="text-white/40 text-[11px]">{{ config.toppings.length }} topping{{ config.toppings.length !== 1 ? 's' : '' }}</p>
            @if (selectedStore()) {
              <p class="text-emerald-400 text-xs font-bold mt-2">📍 {{ selectedStore()!.name }}</p>
            }
            <div class="w-full mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span class="text-white/50 text-sm font-bold">Est. total</span>
              <span class="text-2xl font-black text-orange-400">{{ price() | currency }}</span>
            </div>
          </div>

          <button (click)="addToCart()"
            [disabled]="loading() || !selectedStore()"
            class="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-orange-400 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading() ? '⏳ Adding...' : '🛒 Add to Cart' }}
          </button>

          <button (click)="placeOrder()"
            [disabled]="loading() || !selectedStore()"
            class="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-green-400 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading() ? '⏳ Placing...' : '⚡ Order Now' }}
          </button>

          <button (click)="savePizza()"
            class="w-full py-3.5 rounded-2xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2">
            💾 Save Creation
          </button>
          <p class="text-center text-white/30 text-[11px]">Order goes live to the restaurant instantly.</p>
        </div>
      </div>
    </div>
  `,
})
export class BuilderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly restaurantService = inject(RestaurantService);

  sizes: Opt[] = [
    { label: 'Small', emoji: '🍕' }, { label: 'Medium', emoji: '🍕' },
    { label: 'Large', emoji: '🍕' }, { label: 'X-Large', emoji: '🍕' },
  ];
  crusts: Opt[] = [
    { label: 'Hand Tossed' }, { label: 'Thin Crust' }, { label: 'Deep Dish' },
    { label: 'Stuffed Crust' }, { label: 'New York Style' }, { label: 'Gluten Free' },
  ];
  sauces: Opt[] = [
    { label: 'Tomato' }, { label: 'Marinara' }, { label: 'BBQ' },
    { label: 'Alfredo' }, { label: 'Garlic Parmesan' }, { label: 'No Sauce' },
  ];
  toppings: Opt[] = [
    { label: 'Pepperoni', emoji: '🔴' }, { label: 'Mushrooms', emoji: '🍄' },
    { label: 'Onions', emoji: '🧅' }, { label: 'Sausage', emoji: '🌭' },
    { label: 'Bacon', emoji: '🥓' }, { label: 'Chicken', emoji: '🍗' },
    { label: 'Peppers', emoji: '🫑' }, { label: 'Olives', emoji: '🫒' },
    { label: 'Pineapple', emoji: '🍍' }, { label: 'Extra Cheese', emoji: '🧀' },
    { label: 'Jalapeños', emoji: '🌶️' }, { label: 'Spinach', emoji: '🥬' },
  ];

  config = {
    size: 'Large',
    crust: 'Hand Tossed',
    sauce: 'Tomato',
    toppings: ['Pepperoni'] as string[],
  };

  stores = signal<Store[]>([]);
  selectedStore = signal<Store | null>(null);
  loadingStores = signal(false);
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  ngOnInit(): void {
    this.loadingStores.set(true);
    this.restaurantService.getRestaurants().subscribe({
      next: (list) => { this.stores.set(list); this.loadingStores.set(false); },
      error: () => this.loadingStores.set(false),
    });
  }

  chip(active: boolean): string {
    return `text-center rounded-2xl py-3 transition ${active
      ? 'bg-red-600/25 border border-red-500/50 text-white'
      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`;
  }

  pill(active: boolean): string {
    return `px-3.5 py-2 rounded-xl text-xs font-bold transition ${active
      ? 'bg-red-600 text-white'
      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`;
  }

  toggleTopping(t: string): void {
    this.config.toppings = this.config.toppings.includes(t)
      ? this.config.toppings.filter(x => x !== t)
      : [...this.config.toppings, t];
  }

  emojiFor(t: string): string {
    return this.toppings.find(x => x.label === t)?.emoji ?? '•';
  }

  price(): number {
    const base: Record<string, number> = { Small: 8.99, Medium: 11.99, Large: 14.99, 'X-Large': 17.99 };
    return (base[this.config.size] ?? 12.99) + this.config.toppings.length * 1.25;
  }

  addToCart(): void {
    if (!this.selectedStore()) { this.errorMsg.set('Please select a restaurant first.'); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    
    // Map toppings list of strings to list of objects for the backend AddToCartRequest
    const mappedToppings = this.config.toppings.map(t => ({
      toppingId: null,
      toppingName: t,
      price: 1.25
    }));

    this.cartService.addToCart({
      restaurantId: this.selectedStore()!.id,
      menuItemId: null,
      itemName: 'Custom Builder Pizza',
      size: this.config.size,
      crust: this.config.crust,
      sauce: this.config.sauce,
      quantity: 1,
      unitPrice: this.price(),
      notes: `${this.config.size} ${this.config.crust}, ${this.config.sauce} sauce`,
      toppings: mappedToppings
    }).subscribe({
      next: () => { this.loading.set(false); this.successMsg.set('Added to cart! Click "Order Now" to place your order.'); },
      error: (e: any) => { this.loading.set(false); this.errorMsg.set(e?.error?.message ?? 'Failed to add to cart. Please log in first.'); },
    });
  }

  placeOrder(): void {
    if (!this.selectedStore()) { this.errorMsg.set('Please select a restaurant first.'); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const mappedToppings = this.config.toppings.map(t => ({
      toppingId: null,
      toppingName: t,
      price: 1.25
    }));

    // First ensure item is in cart, then place the order
    this.cartService.addToCart({
      restaurantId: this.selectedStore()!.id,
      menuItemId: null,
      itemName: 'Custom Builder Pizza',
      size: this.config.size,
      crust: this.config.crust,
      sauce: this.config.sauce,
      quantity: 1,
      unitPrice: this.price(),
      notes: `${this.config.size} ${this.config.crust}, ${this.config.sauce} sauce`,
      toppings: mappedToppings
    }).subscribe({
      next: () => {
        this.orderService.placeOrder({
          deliveryType: 'STORE_DELIVERY',
          deliveryAddress: 'Detroit, MI',
          deliveryNotes: '',
          tip: 0,
          paymentMethod: 'CASH',
        }).subscribe({
          next: (order) => {
            this.loading.set(false);
            this.successMsg.set(`🎉 Order #${order.orderNumber} placed! The restaurant has been notified.`);
          },
          error: (e: any) => { this.loading.set(false); this.errorMsg.set(e?.error?.message ?? 'Failed to place order. Please try again.'); },
        });
      },
      error: (e: any) => { this.loading.set(false); this.errorMsg.set(e?.error?.message ?? 'Failed to add to cart.'); },
    });
  }

  savePizza(): void {
    const name = prompt('Enter a name for your custom creation:', 'My Custom Pizza');
    if (name === null) return; // cancelled
    
    this.errorMsg.set('');
    this.successMsg.set('');
    
    try {
      const existingRaw = localStorage.getItem('mislice_saved_pizzas');
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      
      const newPizza = {
        id: Date.now().toString(),
        name: name.trim() || 'My Custom Pizza',
        size: this.config.size,
        crust: this.config.crust,
        toppings: [...this.config.toppings]
      };
      
      list.push(newPizza);
      localStorage.setItem('mislice_saved_pizzas', JSON.stringify(list));
      this.successMsg.set('💾 Pizza saved successfully! You can view and reorder it from your Saved Pizzas page.');
    } catch (err) {
      this.errorMsg.set('Failed to save pizza configuration.');
    }
  }
}
