import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChainCompareService } from '../../core/services/chain-compare.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Quote } from '../../shared/models';

interface Modification {
  id: string;
  label: string;
  priceDelta: number;
  selected: boolean;
}

@Component({
  selector: 'app-comparison-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto py-6 px-4 text-[#F8F8F8]">
      
      <!-- SUCCESS / ERROR BANNERS -->
      @if (successMsg()) {
        <div class="clay border border-brand-green rounded-2xl p-4 text-center text-brand-green font-bold text-sm animate-fade-in">
          ✅ {{ successMsg() }}
        </div>
      }
      @if (errorMsg()) {
        <div class="clay border border-brand-red rounded-2xl p-4 text-center text-brand-red font-bold text-sm animate-fade-in">
          ⚠️ {{ errorMsg() }}
        </div>
      }

      <!-- TOP SUMMARY -->
      <div class="clay rounded-[22px] p-6 border border-[#2B2B31] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#18181B] shadow-xl">
        <div class="flex items-start gap-4">
          <div class="text-4xl filter drop-shadow-[0_4px_10px_rgba(255,100,30,0.4)]">🍕</div>
          <div>
            <h2 class="text-xl font-bold text-[#FFFFFF] tracking-tight">Your Pizza</h2>
            <p class="text-sm font-semibold text-[#B8B8B8] mt-1">
              {{ buildConfig()?.size || 'Large' }} • {{ buildConfig()?.crust || 'Hand Tossed' }}
            </p>
            <p class="text-[11px] text-[#B8B8B8] mt-1 max-w-xl leading-relaxed font-semibold">
              {{ summaryText() }}
            </p>
          </div>
        </div>
        <button (click)="editPizza()" class="px-5 py-2.5 rounded-xl border border-[#2B2B31] text-[#D4AF37] hover:text-[#E2BF53] bg-[#1E1E22] text-xs font-bold transition shadow-sm shrink-0 uppercase tracking-wider">
          ✏️ Edit Pizza
        </button>
      </div>

      <!-- LOADING STATE -->
      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E53935]"></div>
      </div>

      <!-- SPLIT VIEW CONTENT -->
      <div *ngIf="!loading() && quotes().length > 0" class="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start mt-6">
        
        <!-- LEFT COLUMN: QUOTES LIST -->
        <div class="space-y-6">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-[28px] font-bold text-[#FFFFFF]">Compare Quotes</h3>
            <!-- Optional Top filters -->
          </div>

          <!-- Toggles Section -->
          <div class="flex flex-wrap gap-4 px-2 bg-[#18181B] border border-[#2B2B31] rounded-[22px] p-4 shadow-sm">
            <label class="flex items-center gap-3 cursor-pointer group">
              <span class="text-[15px] font-semibold text-[#E5E5E5] transition">Free Delivery</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" [(ngModel)]="filterFreeDelivery" (change)="applyFilters()" />
                <div class="w-10 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <span class="text-[15px] font-semibold text-[#E5E5E5] transition">4+ Stars</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" [(ngModel)]="filterHighRating" (change)="applyFilters()" />
                <div class="w-10 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <span class="text-[15px] font-semibold text-[#E5E5E5] transition">Favourites</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" [(ngModel)]="filterFavs" (change)="applyFilters()" />
                <div class="w-10 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <span class="text-[15px] font-semibold text-[#E5E5E5] transition">Open Now</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" [(ngModel)]="filterOpenNow" (change)="applyFilters()" />
                <div class="w-10 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green peer-focus:outline-none"></div>
              </div>
            </label>
          </div>
          
          <div class="space-y-4">
            <div *ngFor="let quote of quotes(); let i = index" 
              (click)="selectQuote(quote)"
              [style.--electric-border-color]="quote.logoColor || '#E23744'"
              [class]="'electric-border transition-all duration-300 ' + (selectedQuote()?.chainName === quote.chainName ? 'scale-[1.02]' : '')">
              
              <!-- Glow layers for the card -->
              <div class="eb-layers" *ngIf="i === 0 || selectedQuote()?.chainName === quote.chainName">
                <div class="eb-glow-1"></div>
                <div class="eb-glow-2"></div>
                <div class="eb-background-glow"></div>
              </div>

              <!-- Main Card Content Container -->
              <div class="eb-content clay rounded-[22px] p-[28px] flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer transition border border-[#2B2B31] bg-[#18181B] shadow-md hover:shadow-lg gap-4"
                [class.border-[#D4AF37]]="selectedQuote()?.chainName === quote.chainName">
                
                <div class="flex flex-col justify-center gap-1.5">
                  <div class="flex items-center gap-2">
                    <h4 class="text-[22px] font-bold text-[#FFFFFF]">{{ quote.chainName }}</h4>
                    <span *ngIf="i === 0" class="text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0 bg-[#FF8A00] text-white animate-pulse-scale">Best Deal</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-[14px] text-[#B8B8B8] font-semibold">
                    <span class="text-[#D4AF37]">★ {{ quote.rating | number:'1.1-1' }}</span>
                    <span>📍 {{ quote.distance }} away</span>
                    <span>{{ quote.reviews.length }} ratings</span>
                  </div>
                </div>
                
                <div class="sm:text-right shrink-0">
                  <p class="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">{{ quote.basePrice + quote.toppingsCost | currency }}</p>
                  <p class="text-[12px] font-semibold text-[#D4AF37] uppercase tracking-wider mt-0.5">Base Quote</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: CHECKOUT & MODIFICATIONS -->
        <div *ngIf="selectedQuote()" class="clay rounded-[22px] p-6 border border-[#2B2B31] bg-[#18181B] shadow-2xl sticky top-6 animate-fade-in">
          
          <div class="border-b border-[#2B2B31] pb-4 mb-4">
            <h3 class="text-2xl font-bold text-[#FFFFFF]">{{ selectedQuote()!.chainName }}</h3>
            <p class="text-[11px] font-semibold text-[#B8B8B8] mt-1 uppercase tracking-wider">Ready for Checkout</p>
          </div>

          <!-- Restaurant-Specific Modifications -->
          <div class="mb-6">
            <h4 class="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-3">CUSTOMIZE THIS ORDER</h4>
            <div class="space-y-2">
              <label *ngFor="let mod of activeModifications()" class="flex items-center justify-between p-3.5 rounded-xl border border-[#2B2B31] cursor-pointer hover:bg-[#1E1E22] transition bg-[#1E1E22] group">
                <div class="flex items-center gap-3">
                  <input type="checkbox" [(ngModel)]="mod.selected" class="w-4 h-4 accent-red-600 rounded cursor-pointer bg-[#1E1E22] border-[#2B2B31]" />
                  <span class="text-[16px] font-semibold text-[#FFFFFF] transition">{{ mod.label }}</span>
                </div>
                <span class="text-[15px] font-bold text-[#D4AF37]">
                  {{ mod.priceDelta > 0 ? '+' : '' }}{{ mod.priceDelta | currency }}
                </span>
              </label>
            </div>
          </div>

          <!-- Price Math Breakdown -->
          <div class="bg-[#1E1E22] border border-[#2B2B31] rounded-xl p-4 mb-6 space-y-2.5 text-xs">
            <div class="flex justify-between font-semibold text-[#FFFFFF]">
              <span>Original Price</span>
              <span>{{ baseQuotePrice() | currency }}</span>
            </div>
            
            <ng-container *ngFor="let mod of activeModifications()">
              <div *ngIf="mod.selected" class="flex justify-between font-semibold text-[#FFFFFF] animate-fade-in text-[11px]">
                <span>{{ mod.label }}</span>
                <span class="text-[#D4AF37]">{{ mod.priceDelta > 0 ? '+' : '' }}{{ mod.priceDelta | currency }}</span>
              </div>
            </ng-container>

            <div class="border-t border-[#2B2B31] pt-3 mt-3 flex justify-between items-end">
              <span class="font-bold uppercase tracking-widest text-[#D4AF37] text-[13px]">NEW TOTAL</span>
              <span class="text-3xl font-extrabold text-[#FFFFFF] leading-none">{{ newTotal() | currency }}</span>
            </div>
          </div>

          <!-- Delivery Providers -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] border-b border-[#2B2B31] pb-1 mb-2">Select Delivery Method</h4>
            <div *ngFor="let opt of selectedQuote()!.deliveryOptions" class="bg-[#1E1E22] border border-[#2B2B31] rounded-2xl p-4 hover:border-[#D4AF37]/50 transition-colors group">
              <div class="flex justify-between items-center mb-1">
                <div>
                  <span class="font-bold text-sm text-[#FFFFFF]">{{ opt.providerName }}</span>
                  <p class="text-[10px] font-semibold text-[#B8B8B8] mt-0.5">⏱️ {{ opt.estimatedTimeMin }}-{{ opt.estimatedTimeMax }} mins</p>
                </div>
                <div class="text-right">
                  <span class="font-bold text-[#22C55E] text-lg">
                    {{ (newTotal() + opt.priceBreakdown.deliveryFee + opt.priceBreakdown.serviceFee) | currency }}
                  </span>
                  <p class="text-[9px] font-semibold text-[#B8B8B8] uppercase">w/ Fees</p>
                </div>
              </div>
              <button (click)="placeOrder(selectedQuote()!, opt)" [disabled]="submitting()"
                class="w-full mt-3 py-3 rounded-xl bg-[#E53935] text-white hover:bg-[#E53935]/90 font-bold text-xs tracking-wider transition uppercase disabled:opacity-50">
                {{ submitting() ? 'Placing Order...' : 'Order via ' + opt.providerName }}
              </button>
            </div>
          </div>

        </div>

        <!-- Placeholder when nothing is selected -->
        <div *ngIf="!selectedQuote()" class="clay rounded-[22px] p-10 border border-[#2B2B31] text-center sticky top-6 opacity-60 bg-[#18181B] shadow-md">
          <p class="text-5xl mb-4">👈</p>
          <p class="font-bold text-[#FFFFFF] text-lg">Select a Restaurant</p>
          <p class="text-xs font-semibold text-[#B8B8B8] mt-2 leading-relaxed">Choose a quote from the left to view checkout options and make minor edits.</p>
        </div>

      </div>

      <div *ngIf="!loading() && quotes().length === 0" class="text-center py-12 text-[#B8B8B8] font-bold">
        <p>No chains match the selected configuration. Try editing your pizza.</p>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s ease-out forwards;
    }
    @keyframes pulse-scale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    .animate-pulse-scale {
      animation: pulse-scale 1.6s ease-in-out infinite;
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
  allQuotes = signal<Quote[]>([]);
  loading = signal(false);
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  buildConfig = signal<any>(null);
  selectedQuote = signal<Quote | null>(null);
  activeModifications = signal<Modification[]>([]);

  // Filters
  filterFreeDelivery = false;
  filterHighRating = false;
  filterFavs = false;
  filterOpenNow = false;

  applyFilters() {
    let filtered = this.allQuotes();
    if (this.filterFreeDelivery) {
      filtered = filtered.filter(q => q.deliveryOptions.some(o => o.priceBreakdown.deliveryFee === 0));
    }
    if (this.filterHighRating) {
      filtered = filtered.filter(q => q.rating >= 4.0);
    }
    // Favs & Open Now are mocked in frontend
    if (this.filterFavs) {
      filtered = filtered.filter(q => q.rating > 4.5); // just mocking it
    }
    this.quotes.set(filtered);
    if (filtered.length > 0 && !filtered.includes(this.selectedQuote()!)) {
      this.selectQuote(filtered[0]);
    } else if (filtered.length === 0) {
      this.selectedQuote.set(null);
    }
  }

  baseQuotePrice = computed(() => {
    const q = this.selectedQuote();
    return q ? q.basePrice + q.toppingsCost : 0;
  });

  newTotal = computed(() => {
    let total = this.baseQuotePrice();
    for (const mod of this.activeModifications()) {
      if (mod.selected) total += mod.priceDelta;
    }
    return Math.max(0, total);
  });

  summaryText = computed(() => {
    const c = this.buildConfig();
    if (!c) return 'Loading...';
    const parts = [
      c.sauce,
      ...(c.cheeses || []),
      ...(c.meats || []),
      ...(c.veggies || []),
      ...(c.dips || []),
      ...(c.seasonings || []),
      c.bakeInstructions,
      c.cutInstructions
    ].filter(p => !!p && p !== 'No Cheese' && p !== 'Normal Bake' && p !== 'Standard Pie Cut');
    return parts.join(', ');
  });

  ngOnInit() {
    const rawConfig = localStorage.getItem('mislice_current_build');
    if (rawConfig) {
      try {
        this.buildConfig.set(JSON.parse(rawConfig));
      } catch (e) {
        console.error('Failed to parse build config', e);
      }
    }
    this.updateQuotes();
  }

  editPizza() {
    this.router.navigate(['/builder']);
  }

  updateQuotes() {
    this.loading.set(true);
    const cfg = this.buildConfig() || {};
    
    // Convert new builder config format to what ChainCompareService expects
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
      next: (quotes) => {
        this.allQuotes.set(quotes);
        this.quotes.set(quotes);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  selectQuote(quote: Quote) {
    this.selectedQuote.set(quote);
    
    // Generate some contextual modifications based on the config
    const cfg = this.buildConfig();
    const mods: Modification[] = [];
    
    mods.push({ id: 'extra_cheese', label: '+ Extra Cheese', priceDelta: 2.00, selected: false });
    
    if (cfg?.meats?.length > 0) {
      mods.push({ id: 'extra_meat', label: '+ Extra ' + cfg.meats[0], priceDelta: 2.50, selected: false });
    } else {
      mods.push({ id: 'add_pep', label: '+ Add Pepperoni', priceDelta: 1.50, selected: false });
    }
    
    if (cfg?.veggies?.length > 0) {
      mods.push({ id: 'remove_veg', label: 'Remove ' + cfg.veggies[0], priceDelta: -1.00, selected: false });
    }
    
    mods.push({ id: 'crust_upgrade', label: 'Upgrade to Garlic Parm Crust', priceDelta: 1.25, selected: false });

    this.activeModifications.set(mods);
  }

  placeOrder(quote: Quote, option: any): void {
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
          this.errorMsg.set(`Unable to find a registered marketplace restaurant for ${quote.chainName}.`);
          return;
        }

        const selectedModsText = this.activeModifications()
          .filter(m => m.selected)
          .map(m => m.label)
          .join(', ');

        const cfg = this.buildConfig() || {};
        const toppings = [...(cfg.meats || []), ...(cfg.veggies || []), ...(cfg.cheeses || [])];

        const mappedToppings = toppings.map(t => ({
          toppingId: null,
          toppingName: t,
          price: 1.25
        }));

        const cartReq = {
          restaurantId: matched.id,
          menuItemId: null,
          itemName: 'Comparison Custom Pizza',
          size: cfg.size || 'Large',
          crust: cfg.crust || 'Hand Tossed',
          sauce: cfg.sauce || 'Robust Inspired Tomato Sauce',
          quantity: cfg.quantity || 1,
          unitPrice: this.newTotal(), // Live updated price
          notes: `Comparison quote via ${option.providerName}. Mods: ${selectedModsText || 'None'}.`,
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
                this.successMsg.set(`🎉 Order #${order.orderNumber} successfully placed at ${quote.chainName}!`);
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
