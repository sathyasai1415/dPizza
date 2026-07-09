import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChainCompareService } from '../../core/services/chain-compare.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Quote } from '../../shared/models';

@Component({
  selector: 'app-comparison-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto">
      
      <!-- HEADER -->
      <div>
        <h2 class="text-3xl font-black text-white">Compare Pizza Quotes</h2>
        <p class="text-xs sm:text-sm text-white/50">Configure your pizza and see live compared quotes from local national chains.</p>
      </div>

      <!-- SUCCESS / ERROR BANNERS -->
      @if (successMsg()) {
        <div class="glass border border-emerald-500/30 rounded-2xl p-4 text-center text-emerald-400 font-bold text-sm">
          ✅ {{ successMsg() }}
        </div>
      }
      @if (errorMsg()) {
        <div class="glass border border-red-500/30 rounded-2xl p-4 text-center text-red-400 font-bold text-sm">
          ⚠️ {{ errorMsg() }}
        </div>
      }

      <!-- PIZZA PRICE SHOWCASE -->
      <div class="relative overflow-hidden rounded-[24px] select-none mb-8 max-w-2xl mx-auto border border-orange-500/25 shadow-[0_40px_120px_-40px_rgba(220,38,0,0.5)]"
        style="background: radial-gradient(ellipse at 60% 40%, rgba(180,40,0,0.22) 0%, rgba(10,13,24,0) 70%), #0A0D18;">
        
        <!-- Ambient Glow -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-orange-500/10 blur-[30px]"></div>
        </div>

        <!-- Floating Ingredients -->
        <span *ngFor="let ing of showcaseIngredients" 
          class="absolute text-lg pointer-events-none z-10 animate-float"
          [style.left]="ing.x" 
          [style.top]="ing.y"
          [style.animation-delay]="ing.delay"
          [style.animation-duration]="ing.dur">
          {{ ing.emoji }}
        </span>

        <!-- Rotating Pizza -->
        <div class="flex justify-center pt-8 pb-2 relative z-20">
          <div class="animate-spin-slow text-[80px] sm:text-[130px] filter drop-shadow-[0_8px_32px_rgba(255,100,30,0.55)] select-none leading-none">
            🍕
          </div>
        </div>

        <!-- Info Badge -->
        <div class="flex justify-center mb-4 z-20 relative">
          <div class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-300 bg-orange-500/12 border border-orange-500/25">
            🔥 Pepperoni Large · Live Price Comparison
          </div>
        </div>

        <!-- Showcase Quotes List -->
        <div class="px-4 pb-5 space-y-2 z-20 relative">
          <div *ngFor="let card of showcaseCards"
            class="flex items-center gap-3 rounded-2xl px-4 py-2.5 border transition"
            [class.best-deal-gradient]="card.best"
            [class.normal-card-bg]="!card.best">
            <span class="text-base">🍕</span>
            <span class="flex-1 text-xs sm:text-sm font-bold text-white truncate">{{ card.store }}</span>
            <span class="text-[10px] text-white/50">{{ card.time }}</span>
            <span class="text-[10px] text-amber-400">★ {{ card.rating }}</span>
            <span class="text-sm font-black" [class.text-orange-300]="card.best" [class.text-white/80]="!card.best">
              {{ card.price | currency }}
            </span>
            <span *ngIf="card.best" 
              class="text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0 bg-orange-500 text-white animate-pulse-scale">
              Best Deal
            </span>
          </div>
        </div>
      </div>

      <!-- INTERACTIVE CONTROLS -->
      <div class="glass p-6 rounded-[2rem] space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Size selection -->
          <div>
            <label class="block text-xs font-bold text-white/40 uppercase mb-2">Pizza Size</label>
            <select [(ngModel)]="size" (change)="updateQuotes()"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500">
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Extra Large">Extra Large</option>
            </select>
          </div>

          <!-- Crust selection -->
          <div>
            <label class="block text-xs font-bold text-white/40 uppercase mb-2">Crust Type</label>
            <select [(ngModel)]="crust" (change)="updateQuotes()"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500">
              <option value="Hand Tossed">Hand Tossed</option>
              <option value="Handmade Pan">Handmade Pan</option>
              <option value="Crunchy Thin Crust">Crunchy Thin Crust</option>
              <option value="Gluten Free Crust">Gluten Free Crust</option>
            </select>
          </div>

          <!-- Delivery type preference -->
          <div>
            <label class="block text-xs font-bold text-white/40 uppercase mb-2">Fulfillment</label>
            <select [(ngModel)]="deliveryType" (change)="updateQuotes()"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500">
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup Only</option>
            </select>
          </div>

          <!-- Quantity selection -->
          <div>
            <label class="block text-xs font-bold text-white/40 uppercase mb-2">Quantity</label>
            <input type="number" [(ngModel)]="quantity" min="1" (change)="updateQuotes()"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-red-500" />
          </div>
        </div>

        <!-- Toppings checklists -->
        <div>
          <label class="block text-xs font-bold text-white/40 uppercase mb-3">Add Toppings</label>
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let topping of availableToppings" (click)="toggleTopping(topping)"
              [class]="hasTopping(topping) ? 'bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 text-xs px-3.5 py-2 rounded-xl transition'">
              {{ topping }}
            </button>
          </div>
        </div>
      </div>

      <!-- QUOTE SEARCH STATUS -->
      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
      </div>

      <!-- QUOTES RENDER -->
      <div *ngIf="!loading() && quotes().length === 0" class="text-center py-12 text-white/40">
        <p>No chains match the selected configuration.</p>
      </div>

      <div *ngIf="!loading() && quotes().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let quote of quotes()"
          class="glass rounded-[2rem] overflow-hidden flex flex-col group relative animate-fade-in">
          
          <!-- Banner header -->
          <div class="h-28 relative flex items-center justify-center p-4"
            [style.background]="quote.logoColor ? quote.logoColor : 'linear-gradient(135deg, #2b1f41 0%, #171025 100%)'">
            <div class="text-center">
              <h3 class="text-xl font-black text-white drop-shadow-md">{{ quote.chainName }}</h3>
              <p class="text-[10px] text-white/70 mt-1">📍 {{ quote.distance }} away</p>
            </div>
            <!-- Overall badges -->
            <div class="absolute top-3 right-3 flex flex-col gap-1">
              <span *ngFor="let badge of quote.badges"
                class="text-[8px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                {{ badge }}
              </span>
            </div>
          </div>

          <!-- Price & Options Breakdown -->
          <div class="p-6 flex-1 flex flex-col justify-between space-y-6">
            
            <div class="space-y-4">
              <!-- Item level base math -->
              <div class="flex justify-between text-xs text-white/40">
                <span>Base ({{ size }} Size):</span>
                <span class="text-white font-bold">{{ quote.basePrice | currency }}</span>
              </div>
              <div class="flex justify-between text-xs text-white/40 border-b border-white/5 pb-2">
                <span>Toppings cost:</span>
                <span class="text-white font-bold">{{ quote.toppingsCost | currency }}</span>
              </div>

              <!-- Available delivery options / provider pricing -->
              <div class="space-y-3">
                <h4 class="text-xs font-bold text-white/40 uppercase">Delivery Provider Quotes</h4>
                
                <div *ngFor="let opt of quote.deliveryOptions"
                  class="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-bold text-xs text-white">{{ opt.providerName }}</span>
                      <p class="text-[9px] text-white/40 mt-0.5">⏱️ {{ opt.estimatedTimeMin }}-{{ opt.estimatedTimeMax }} mins</p>
                    </div>
                    <span class="font-black text-green-400 text-sm">
                      {{ opt.priceBreakdown.grandTotal | currency }}
                    </span>
                  </div>
                  <!-- Option badges -->
                  <div *ngIf="opt.badges.length > 0" class="flex gap-1.5 pt-1">
                    <span *ngFor="let optBadge of opt.badges"
                      class="text-[8px] font-bold text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      {{ optBadge }}
                    </span>
                  </div>

                  <!-- ORDER / CHECKOUT BUTTON -->
                  <button (click)="placeOrder(quote, opt)" [disabled]="submitting()"
                    class="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-[10px] tracking-wider transition uppercase disabled:opacity-50">
                    {{ submitting() ? 'Placing Order...' : 'Order Now' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Customer Reviews Summary -->
            <div class="border-t border-white/10 pt-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-yellow-400 font-bold text-xs">★ {{ quote.rating | number:'1.1-1' }}</span>
                <span class="text-[10px] text-white/40">({{ quote.reviews.length }} chain ratings)</span>
              </div>
              <div class="space-y-2">
                <div *ngFor="let rev of quote.reviews.slice(0, 1)" class="bg-black/20 p-2.5 rounded-xl">
                  <p class="text-[10px] font-bold text-white/70">{{ rev.authorName }}</p>
                  <p class="text-[10px] text-white/50 mt-0.5 line-clamp-2">"{{ rev.comment }}"</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .best-deal-gradient {
      background: linear-gradient(135deg, rgba(220,80,0,0.28) 0%, rgba(255,150,50,0.12) 100%);
      border: 1px solid rgba(255,120,30,0.55);
    }
    .normal-card-bg {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
    }
    @keyframes float-ing {
      0%, 100% { transform: translateY(0) rotate(-8deg); opacity: 0.55; }
      50% { transform: translateY(-10px) rotate(8deg); opacity: 0.9; }
    }
    .animate-float {
      animation: float-ing 4s ease-in-out infinite;
    }
    @keyframes spin-pizza {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-pizza 22s linear infinite;
    }
    @keyframes pulse-scale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    .animate-pulse-scale {
      animation: pulse-scale 1.6s ease-in-out infinite;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.5s ease-out forwards;
    }
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

  // Configuration state
  size = 'Large';
  crust = 'Hand Tossed';
  deliveryType = 'delivery';
  quantity = 1;
  toppings: string[] = ['Pepperoni'];

  availableToppings = [
    'Pepperoni', 'Mushrooms', 'Onions', 'Green Peppers', 
    'Black Olives', 'Italian Sausage', 'Ham', 'Premium Chicken'
  ];

  // Pizza price showcase data matching past UI reference
  showcaseCards = [
    { store: "Domino's", price: 14.99, time: '25 min', rating: 4.2, best: false },
    { store: 'Pizza Hut', price: 13.49, time: '30 min', rating: 4.0, best: false },
    { store: "Papa John's", price: 15.99, time: '35 min', rating: 4.3, best: false },
    { store: 'Shamz Pizza', price: 11.99, time: '18 min', rating: 4.8, best: true  },
  ];

  showcaseIngredients = [
    { emoji: '🌿', x: '6%',  y: '10%', delay: '0s', dur: '4.2s' },
    { emoji: '🧀', x: '84%', y: '8%',  delay: '0.6s', dur: '3.8s' },
    { emoji: '🍅', x: '4%',  y: '70%', delay: '1.1s', dur: '4.5s' },
    { emoji: '🫒', x: '88%', y: '65%', delay: '0.3s', dur: '3.5s' },
    { emoji: '🌶️', x: '50%', y: '3%',  delay: '0.8s', dur: '4.0s' },
    { emoji: '🧅', x: '16%', y: '86%', delay: '1.5s', dur: '3.9s' },
  ];

  ngOnInit() {
    this.updateQuotes();
  }

  toggleTopping(topping: string) {
    const idx = this.toppings.indexOf(topping);
    if (idx > -1) {
      this.toppings.splice(idx, 1);
    } else {
      this.toppings.push(topping);
    }
    this.updateQuotes();
  }

  hasTopping(topping: string): boolean {
    return this.toppings.includes(topping);
  }

  updateQuotes() {
    this.loading.set(true);
    const config = {
      size: this.size,
      crust: this.crust,
      sauce: 'Robust Inspired Tomato Sauce',
      cheese: ['Mozzarella'],
      meats: this.toppings.filter(t => ['Pepperoni', 'Italian Sausage', 'Ham', 'Premium Chicken'].includes(t)),
      veggies: this.toppings.filter(t => ['Mushrooms', 'Onions', 'Green Peppers', 'Black Olives'].includes(t)),
      extras: [],
      quantity: this.quantity
    };

    this.chainCompareService.comparePizzas(config, this.deliveryType).subscribe({
      next: (quotes) => {
        this.quotes.set(quotes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  placeOrder(quote: Quote, option: any): void {
    this.submitting.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    // Fetch live restaurants to resolve correct store UUID
    this.restaurantService.getRestaurants().subscribe({
      next: (stores) => {
        const matched = stores.find(s => 
          s.name.toLowerCase().includes(quote.chainName.toLowerCase()) || 
          quote.chainName.toLowerCase().includes(s.name.toLowerCase())
        );

        if (!matched) {
          this.submitting.set(false);
          this.errorMsg.set(`Unable to find a registered marketplace restaurant for ${quote.chainName}.`);
          return;
        }

        const mappedToppings = this.toppings.map(t => ({
          toppingId: null,
          toppingName: t,
          price: 1.25
        }));

        // Calculate a reasonable comparison estimate price
        const basePrice = quote.basePrice || 14.99;
        const totalToppingsCost = this.toppings.length * 1.25;
        const estimatedUnitPrice = basePrice + totalToppingsCost;

        const cartReq = {
          restaurantId: matched.id,
          menuItemId: null,
          itemName: 'Comparison Custom Pizza',
          size: this.size,
          crust: this.crust,
          sauce: 'Robust Inspired Tomato Sauce',
          quantity: this.quantity,
          unitPrice: estimatedUnitPrice,
          notes: `Comparison quote order via ${option.providerName}. Size: ${this.size}, Crust: ${this.crust}.`,
          toppings: mappedToppings
        };

        this.cartService.addToCart(cartReq).subscribe({
          next: () => {
            this.orderService.placeOrder({
              deliveryType: this.deliveryType === 'delivery' ? 'STORE_DELIVERY' : 'PICKUP',
              deliveryAddress: 'Detroit, MI',
              deliveryNotes: `Provider: ${option.providerName}`,
              tip: 0,
              paymentMethod: 'CASH',
            }).subscribe({
              next: (order) => {
                this.submitting.set(false);
                this.successMsg.set(`🎉 Order #${order.orderNumber} successfully placed at ${quote.chainName}! The owner dashboard has been updated.`);
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
        this.errorMsg.set('Failed to connect to marketplace restaurant listing data.');
      }
    });
  }
}
