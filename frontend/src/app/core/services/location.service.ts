import { Injectable, inject, signal, effect } from '@angular/core';
import { RestaurantService } from './restaurant.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly restaurantService = inject(RestaurantService);

  // Available cities list dynamically loaded from database
  readonly citiesList = signal<string[]>(['All']);

  // Selected city state, loaded from localStorage if exists, default to 'All'
  readonly selectedCity = signal<string>(
    localStorage.getItem('mislice_selected_city') || 'All'
  );

  constructor() {
    // Sync to localStorage whenever it changes
    effect(() => {
      localStorage.setItem('mislice_selected_city', this.selectedCity());
    });
    this.loadCities();
  }

  loadCities() {
    this.restaurantService.getCities().subscribe({
      next: (cList) => {
        this.citiesList.set(['All', ...cList.map(c => String(c))]);
      },
      error: (err) => {
        console.error('Failed to load cities in LocationService:', err);
        this.citiesList.set(['All', 'Detroit', 'Ann Arbor', 'Grand Rapids']);
      }
    });
  }

  selectCity(city: string) {
    this.selectedCity.set(city);
  }
}
