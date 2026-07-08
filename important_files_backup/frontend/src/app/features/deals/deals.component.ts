import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Deal } from '../../shared/models';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full space-y-6">
      <!-- Header -->
      <div class="relative overflow-hidden rounded-[28px] border border-orange-500/40 bg-gradient-to-br from-red-950 to-orange-950 p-8">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_45%)] pointer-events-none"></div>
        <div class="relative z-10">
          <span class="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-300 border border-orange-400/30">
            🔥 Live Michigan Deals
          </span>
          <h1 class="mt-4 text-3xl sm:text-4xl font-black text-white">Deals &amp; Offers</h1>
          <p class="mt-2 text-sm text-orange-100/70">Flash deals, BOGO offers and student discounts from local pizzerias.</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading() && deals().length === 0"
        class="glass rounded-3xl p-12 text-center text-white/50">
        <p class="text-4xl mb-3">🏷️</p>
        <p class="font-black text-white mb-1">No active deals right now</p>
        <p class="text-sm">Check back soon — stores post new offers all the time.</p>
      </div>

      <!-- Deals grid -->
      <div *ngIf="!loading() && deals().length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let d of deals()" class="glass rounded-3xl p-5 flex flex-col hover:border-orange-500/30 transition">
          <div class="flex items-start justify-between gap-2 mb-3">
            <span class="text-2xl">{{ d.badge || '🏷️' }}</span>
            <span *ngIf="d.discountValue" class="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2 py-1 rounded-full">
              {{ d.discountType === 'percentage' ? d.discountValue + '% OFF' : ('$' + d.discountValue + ' OFF') }}
            </span>
          </div>
          <p class="text-base font-black text-white leading-tight">{{ d.title }}</p>
          <p class="text-xs text-white/50 mt-1 flex-1">{{ d.description }}</p>
          <div class="mt-4 flex items-center justify-between">
            <span *ngIf="d.code" class="text-[11px] font-black text-orange-300 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg tracking-wider">{{ d.code }}</span>
            <button (click)="browse()" class="text-xs font-black text-white bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 rounded-xl hover:from-red-500 hover:to-orange-400 transition">
              Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DealsComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);

  deals = signal<Deal[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const svc = this.restaurantService as any;
    const call = typeof svc.getDeals === 'function' ? svc.getDeals() : null;
    if (call && typeof call.subscribe === 'function') {
      call.subscribe({
        next: (d: Deal[]) => { this.deals.set(d ?? []); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  browse(): void { this.router.navigate(['/home']); }
}
