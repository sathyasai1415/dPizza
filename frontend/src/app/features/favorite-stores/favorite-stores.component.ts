import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Store } from '../../shared/models';
import { HyperspeedComponent } from '../../shared/hyperspeed/hyperspeed.component';

@Component({
  selector: 'app-favorite-stores',
  standalone: true,
  imports: [CommonModule, HyperspeedComponent],
  template: `
    <div class="relative min-h-[80vh] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 overflow-hidden rounded-none">
      <!-- Hyperspeed background -->
      <div class="absolute inset-0 z-0"><app-hyperspeed></app-hyperspeed></div>
      <div class="absolute inset-0 z-[1] bg-black/55 pointer-events-none"></div>
      <div class="relative z-10 w-full max-w-5xl mx-auto space-y-6">
      <div>
        <h1 class="text-3xl font-black text-white">Favorite Stores</h1>
        <p class="text-white/50 text-sm mt-1">Quick access to the pizzerias you love most.</p>
      </div>

      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
      </div>

      @if (!loading() && favorites().length === 0) {
        <div class="glass rounded-3xl p-12 text-center">
          <p class="text-4xl mb-3">⭐</p>
          <p class="font-black text-white mb-1">No favorites yet</p>
          <p class="text-sm text-white/50 mb-5">Tap the heart on any store to save it here.</p>
          <button (click)="router.navigate(['/home'])" class="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition">
            Browse Stores
          </button>
        </div>
      }

      <div *ngIf="!loading() && favorites().length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (s of favorites(); track s.slug) {
          <div (click)="router.navigate(['/restaurants', s.slug])"
            class="group glass rounded-3xl overflow-hidden cursor-pointer hover:border-red-500/30 transition">
            <div class="h-24 flex items-center justify-center text-4xl" [style.background]="s.brandColor || 'rgba(255,255,255,0.03)'">{{ s.emoji }}</div>
            <div class="p-4">
              <div class="flex items-center justify-between">
                <p class="font-black text-white group-hover:text-red-400 transition">{{ s.name }}</p>
                <button (click)="unfav(s, $event)" class="text-red-500">❤️</button>
              </div>
              <p class="text-xs text-white/50">{{ s.neighborhood || s.city }}</p>
              <p class="text-xs text-yellow-400 font-bold mt-1">★ {{ s.ratingAvg | number:'1.1-1' }}</p>
            </div>
          </div>
        }
      </div>
      </div><!-- /z-10 content -->
    </div>
  `,
})
export class FavoriteStoresComponent implements OnInit {
  readonly router = inject(Router);
  private readonly restaurantService = inject(RestaurantService);
  favorites = signal<Store[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const favIds: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
    this.restaurantService.getRestaurants().subscribe({
      next: stores => {
        this.favorites.set(favIds.length ? stores.filter(s => favIds.includes(s.id) || favIds.includes(s.slug)) : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  unfav(s: Store, e: Event): void {
    e.stopPropagation();
    const favIds: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
    const next = favIds.filter(id => id !== s.id && id !== s.slug);
    localStorage.setItem('mislice_fav_stores', JSON.stringify(next));
    this.favorites.update(list => list.filter(x => x.slug !== s.slug));
  }
}
