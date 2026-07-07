import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChainCompareService } from '../../core/services/chain-compare.service';
import { Quote } from '../../shared/models';

@Component({
  selector: 'app-comparison-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto">
      
      <!-- HEADER -->
      <div>
        <h2 class="text-3xl font-black text-white">Compare Pizza Quotes</h2>
        <p class="text-xs sm:text-sm text-white/50">Configure your pizza and see live compared quotes from local national chains.</p>
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
          class="glass rounded-[2rem] overflow-hidden flex flex-col group relative">
          
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
  `
})
export class ComparisonCardsComponent implements OnInit {
  private readonly chainCompareService = inject(ChainCompareService);

  quotes = signal<Quote[]>([]);
  loading = signal(false);

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
}
