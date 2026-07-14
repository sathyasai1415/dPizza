import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChainCompareService } from '../../core/services/chain-compare.service';
import { Quote } from '../../shared/models';

@Component({
  selector: 'app-quick-compare',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <!-- HEADER -->
      <div class="flex items-center gap-4">
        <button (click)="goBack()" class="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 hover:border-red-500 hover:bg-neutral-800 text-white flex items-center justify-center transition-all shadow-lg text-xl">
          ←
        </button>
        <div>
          <h1 class="text-3xl font-black text-white capitalize flex items-center gap-3">
            <span>{{ displayIcon() }}</span> 
            <span>{{ displayIntent() }}</span>
          </h1>
          <p class="text-sm text-neutral-400 mt-1">Comparing exact quotes from every store near you.</p>
        </div>
      </div>

      <!-- SIZE FILTER TABS -->
      <div class="flex flex-wrap items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-3 rounded-2xl">
        <span class="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Compare Size:</span>
        @for (sz of sizes; track sz.value) {
          <button (click)="changeSize(sz.value)"
            [class]="selectedSize() === sz.value
              ? 'bg-red-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-red-600/20 transition-all active:scale-95'
              : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-neutral-800 active:scale-95'">
            {{ sz.label }}
          </button>
        }
      </div>
 
      <!-- QUICK COMPARE TABLE -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-neutral-950 border-b border-neutral-800 text-xs font-black uppercase tracking-widest text-neutral-500">
                <th class="py-5 px-6">Restaurant</th>
                <th class="py-5 px-6">Size</th>
                <th class="py-5 px-6">Price</th>
                <th class="py-5 px-6">Delivery</th>
                <th class="py-5 px-6">Total</th>
                <th class="py-5 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="py-20 text-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-2 border-red-600 border-t-transparent mx-auto"></div>
                    <p class="text-neutral-500 font-medium mt-4">Running matching engine...</p>
                  </td>
                </tr>
              } @else {
                @for (quote of filteredQuotes(); track quote.chainId; let idx = $index) {
                  <tr class="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors group">
                    <td class="py-4 px-6">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner"
                             [style.background]="quote.logoColor || 'rgba(255,255,255,0.05)'">
                           🍕
                        </div>
                        <div>
                          <p class="font-black text-white text-base group-hover:text-red-400 transition-colors">{{ quote.chainName }}</p>
                          <p class="text-xs text-neutral-500 font-medium truncate max-w-[200px]" [title]="quote.nativeMenuName">
                            {{ quote.nativeMenuName || 'Standard' }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-6 text-neutral-300 font-medium">
                      {{ quote.nativeSize || 'Large' }}
                    </td>
                    <td class="py-4 px-6 text-neutral-300 font-bold">
                      {{ getSubtotal(quote) | currency }}
                    </td>
                    <td class="py-4 px-6 text-neutral-400">
                      {{ getDeliveryFee(quote) === 0 ? 'Free' : (getDeliveryFee(quote) | currency) }}
                    </td>
                    <td class="py-4 px-6 text-white font-black text-lg">
                      {{ getTotal(quote) | currency }}
                    </td>
                    <td class="py-4 px-6 text-center">
                      <button class="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 w-full">
                        1-Tap Order
                      </button>
                    </td>
                  </tr>
                }
                @if (filteredQuotes().length === 0) {
                  <tr>
                    <td colspan="6" class="py-16 text-center text-neutral-500 font-medium">
                      No matching pizzas found for this size class.
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class QuickCompareComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly compareService = inject(ChainCompareService);

  intent = signal<string>('pepperoni');
  searchQuery = signal<string | null>(null);
  quotes = signal<Quote[]>([]);
  loading = signal(true);
  selectedSize = signal<string>('14"');
 
  sizes = [
    { label: 'Personal (10")', value: '10"' },
    { label: 'Medium (12")', value: '12"' },
    { label: 'Large (14")', value: '14"' },
    { label: 'Extra Large (16")', value: '16"' }
  ];
 
  filteredQuotes = computed(() => {
    const size = this.selectedSize();
    const list = this.quotes();
    if (this.searchQuery()) {
      return list;
    }
    return list.filter(q => q.nativeSize === size);
  });
 
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const qIntent = params['intent'];
      const qSearch = params['q'];
 
      if (qSearch) {
        this.searchQuery.set(qSearch);
        this.selectedSize.set(this.detectSize(qSearch));
        this.loadSearchQuotes(qSearch);
      } else if (qIntent) {
        this.intent.set(qIntent);
        this.selectedSize.set('14"');
        this.loadQuotes(qIntent);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }
 
  detectSize(query: string): string {
    const q = query.toLowerCase();
    if (q.includes("10") || q.includes("small") || q.includes("personal")) return '10"';
    if (q.includes("12") || q.includes("medium")) return '12"';
    if (q.includes("16") || q.includes("xl") || q.includes("extra large") || q.includes("18")) return '16"';
    return '14"'; // default to Large (14")
  }
 
  changeSize(size: string) {
    this.selectedSize.set(size);
    if (this.searchQuery()) {
      let q = this.searchQuery() || '';
      // Strip existing size keywords
      q = q.replace(/\b(10|12|14|16|18)(?:"|\s*inch)?\b/gi, '').trim();
      q = q.replace(/\b(small|medium|large|extra large|personal)\b/gi, '').trim();
      
      const newQuery = `${q} ${size}`;
      this.searchQuery.set(newQuery);
      this.loadSearchQuotes(newQuery);
    }
  }
 
  loadSearchQuotes(query: string) {
    this.loading.set(true);
    this.compareService.searchQuotes(query, 'delivery').subscribe({
      next: (res) => {
        this.quotes.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
 
  loadQuotes(intentStr: string) {
    this.loading.set(true);
    this.compareService.getQuickQuotes(intentStr, 'delivery').subscribe({
      next: (res) => {
        this.quotes.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  displayIntent(): string {
    if (this.searchQuery()) {
      return `Results for "${this.searchQuery()}"`;
    }
    return this.intent().replace('_', ' ') + ' Pizza';
  }

  displayIcon(): string {
    if (this.searchQuery()) return '🔍';
    switch(this.intent()) {
      case 'cheese': return '🧀';
      case 'meat_lovers': return '🥓';
      case 'hawaiian': return '🍍';
      case 'bbq_chicken': return '🍗';
      default: return '🍕';
    }
  }

  getSubtotal(q: Quote): number {
    return q.deliveryOptions[0]?.priceBreakdown?.subtotal || 0;
  }
  getDeliveryFee(q: Quote): number {
    return q.deliveryOptions[0]?.priceBreakdown?.deliveryFee || 0;
  }
  getTotal(q: Quote): number {
    return q.deliveryOptions[0]?.priceBreakdown?.grandTotal || 0;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
