import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { LocationService } from '../../core/services/location.service';

interface SpecialPizza {
  name: string;
  emoji: string;
  price: number;
  discountPrice?: number;
  tags: string[];
  description: string;
  restaurant: string;
  rating: number;
  prepTime: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 rounded-[32px] bg-[#0E0E10]">

      <!-- LIVE DEALS TICKER -->
      <div class="w-full py-3 bg-[#0A0A0A] rounded-2xl border border-[#D4AF37]/20 overflow-hidden relative group shadow-sm">
        <div class="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] text-xs font-medium text-[#D4AF37]/80 gap-16">
          <span class="inline-flex items-center gap-1.5">🍕 <strong class="text-[#F4EFE6]">Shamz Pizza:</strong> Large Pepperoni now $11.99</span>
          <span class="inline-flex items-center gap-1.5">🏷️ <strong class="text-[#F4EFE6]">Marco's:</strong> Buy One Get One Free</span>
          <span class="inline-flex items-center gap-1.5">⚡ <strong class="text-[#F4EFE6]">Pizza Hut:</strong> Free delivery on orders over $20</span>
          <span class="inline-flex items-center gap-1.5">🔥 <strong class="text-[#F4EFE6]">Jet's Pizza:</strong> 30% off all deep dish orders</span>
          <span class="inline-flex items-center gap-1.5">💰 <strong class="text-[#F4EFE6]">Bunty's Pizza:</strong> $5 off any extra-large pizza</span>
        </div>
      </div>

      <!-- HERO SHOWCASE BANNER -->
      <div class="rounded-[22px] border border-[#2B2B31] bg-gradient-to-r from-[#18181B] to-[#1E1E22] p-8 md:p-12 relative overflow-hidden flex flex-col justify-center items-start shadow-xl">
        <div class="absolute right-10 bottom-0 top-0 opacity-20 pointer-events-none text-9xl hidden md:flex items-center justify-center select-none animate-pulse">
          🍕🍳🔥
        </div>
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/35 mb-4">
          Featured Specials
        </span>
        <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none mb-4">
          Craving the Perfect Slice?
        </h1>
        <p class="text-[16px] text-[#B8B8B8] max-w-xl mb-8 font-medium leading-relaxed">
          Compare local pizzeria menus, find the absolute cheapest or fastest delivery options near you, or customize your own masterpiece from scratch.
        </p>
        <div class="flex flex-wrap gap-4">
          <button (click)="navigateToBuilder()"
            class="px-6 py-3.5 rounded-xl text-xs font-bold bg-[#E53935] hover:bg-[#E53935]/90 text-white transition-all uppercase tracking-wider shadow-md">
            🍕 Build Your Pizza
          </button>
          <button (click)="navigateToOrder()"
            class="px-6 py-3.5 rounded-xl text-xs font-bold border border-[#2B2B31] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-white transition-all uppercase tracking-wider">
            🗺️ Explore Pizzerias Map
          </button>
        </div>
      </div>

      <!-- RECOMMENDATIONS & SPECIALS PIZZAS -->
      <section class="space-y-6">
        <div class="border-b border-[#2B2B31] pb-3 flex items-center justify-between">
          <div>
            <h2 class="text-[28px] font-bold text-white">Specials &amp; Recommendations</h2>
            <p class="text-[16px] text-[#A9A9A9]">Handpicked premium deals and custom specials near you</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
          <div *ngFor="let item of recommendedPizzas"
            class="group rounded-[22px] bg-[#18181B] border border-[#2B2B31] hover:border-[#D4AF37]/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-sm">
            
            <div>
              <!-- Header Image/Emoji Surface -->
              <div class="h-44 relative bg-[#1E1E22] flex items-center justify-center text-7xl select-none group-hover:scale-102 transition duration-300">
                <span>{{ item.emoji }}</span>
                <span class="absolute top-3 left-3 text-[9px] bg-[#E53935] text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-md">
                  {{ item.tags[0] }}
                </span>
                <span *ngIf="item.discountPrice" class="absolute top-3 right-3 text-[10px] bg-[#22C55E] text-black px-2 py-0.5 rounded-md font-bold">
                  Save {{ (item.price - item.discountPrice) | currency }}
                </span>
              </div>

              <!-- Content Container -->
              <div class="p-[28px] space-y-3.5">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-xl font-bold text-white leading-tight group-hover:text-[#D4AF37] transition-colors">
                    {{ item.name }}
                  </h3>
                  <div class="flex items-center shrink-0 text-xs font-semibold text-neutral-400">
                    <span class="text-[#D4AF37] mr-1">★</span> {{ item.rating }}
                  </div>
                </div>

                <p class="text-[14px] text-[#B8B8B8] font-medium leading-relaxed line-clamp-3">
                  {{ item.description }}
                </p>

                <p class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                  🍕 By {{ item.restaurant }}
                </p>
              </div>
            </div>

            <!-- Footer / Purchase Card -->
            <div class="px-[28px] pb-[28px] pt-2 border-t border-[#2B2B31]/40 flex items-center justify-between gap-4">
              <div>
                <span class="text-[10px] text-neutral-500 block font-bold uppercase">Price</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-lg font-black text-white" [class.line-through]="item.discountPrice" [class.text-neutral-500]="item.discountPrice">
                    {{ item.price | currency }}
                  </span>
                  <span *ngIf="item.discountPrice" class="text-lg font-black text-[#D4AF37]">
                    {{ item.discountPrice | currency }}
                  </span>
                </div>
              </div>
              <button (click)="quickCompare(item.name)"
                class="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#E53935] hover:bg-[#E53935]/90 text-white transition uppercase tracking-wider">
                Order Now
              </button>
            </div>

          </div>
        </div>
      </section>

      <!-- TOP MENU PIZZAS -->
      <section class="space-y-6">
        <div class="border-b border-[#2B2B31] pb-3">
          <h2 class="text-[28px] font-bold text-white">Top Menu Pizzas</h2>
          <p class="text-[16px] text-[#A9A9A9]">The most popular local pizza recipes in Michigan</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div *ngFor="let item of topMenuPizzas"
            class="rounded-[22px] bg-[#18181B] border border-[#2B2B31] hover:border-[#D4AF37]/30 p-[28px] flex items-start gap-4 shadow-sm transition-all duration-300">
            <span class="text-5xl select-none">{{ item.emoji }}</span>
            <div class="flex-1 space-y-2">
              <div class="flex justify-between items-start gap-2">
                <h4 class="text-[20px] font-bold text-white">{{ item.name }}</h4>
                <span class="text-sm font-black text-[#D4AF37]">{{ item.price | currency }}</span>
              </div>
              <p class="text-[14px] text-[#B8B8B8] font-medium leading-relaxed">
                {{ item.description }}
              </p>
              <div class="pt-2 flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#FF8A00]">
                  🔥 Popular Item
                </span>
                <button (click)="quickCompare(item.name)"
                  class="px-3.5 py-1.5 rounded-lg border border-neutral-700 bg-white/5 text-[11px] font-bold text-neutral-300 hover:border-[#D4AF37] hover:text-white transition">
                  Quick Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    @keyframes marquee {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: flex;
      width: 200%;
      animation: marquee 20s linear infinite;
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);

  recommendedPizzas: SpecialPizza[] = [
    {
      name: 'Spicy Honey Pepperoni Melt',
      emoji: '🌶️',
      price: 15.99,
      discountPrice: 12.99,
      tags: ['Bestseller', 'Spicy'],
      description: 'Double pepperoni, hot honey drizzle, jalapeno coins, and gooey mozzarella on a crispy golden crust.',
      restaurant: 'Marco\'s Pizza',
      rating: 4.8,
      prepTime: 20
    },
    {
      name: 'Cheesy Garlic Truffle Supreme',
      emoji: '🍄',
      price: 17.99,
      tags: ['Chef Special', 'Vegetarian'],
      description: 'Rich garlic white cream base, truffle oil drizzle, button mushrooms, spinach, and caramelized sweet onions.',
      restaurant: 'Jet\'s Pizza',
      rating: 4.7,
      prepTime: 25
    },
    {
      name: 'Detroit Crispy bacon Ranch',
      emoji: '🥓',
      price: 16.49,
      discountPrice: 14.49,
      tags: ['Detroit Style', 'Heavy'],
      description: 'Thick square deep-dish crust with caramelized crispy cheese borders, smoked bacon bits, and creamy garlic ranch swirl.',
      restaurant: 'Bunty\'s Pizza',
      rating: 4.9,
      prepTime: 22
    }
  ];

  topMenuPizzas = [
    {
      name: 'Classic Detroit Deep Dish',
      emoji: '📐',
      price: 13.99,
      description: 'Authentic Michigan square pizza with thick marinara stripe on top and crispy brown cheddar cheese edge.'
    },
    {
      name: 'Brooklyn Style Pepperoni Feast',
      emoji: '🗽',
      price: 14.99,
      description: 'Huge foldable thin crust slices packed with cup-and-char pepperoni and Italian spices.'
    },
    {
      name: 'Four Cheese Garlic Thin Crust',
      emoji: '🧀',
      price: 11.99,
      description: 'Mozzarella, parmesan, asiago, and romano cheeses melted over fresh crushed garlic sauce.'
    },
    {
      name: 'Tavern Square Cut Supreme',
      emoji: '✂️',
      price: 15.49,
      description: 'Ultra thin, cracker-like square cut pub crust loaded with spicy sausage chunks, peppers, and red onions.'
    }
  ];

  ngOnInit() {}

  navigateToBuilder() {
    this.router.navigate(['/builder']);
  }

  navigateToOrder() {
    this.router.navigate(['/order']);
  }

  quickCompare(intent: string) {
    this.router.navigate(['/quick-compare'], { queryParams: { intent } });
  }
}
