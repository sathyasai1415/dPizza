import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItem, PizzaOptionsResponse } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMenuItems(restaurantId: string): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/restaurants/${restaurantId}/menu`);
  }

  getPizzaOptions(restaurantId: string): Observable<PizzaOptionsResponse> {
    return this.http.get<PizzaOptionsResponse>(`${this.apiUrl}/restaurants/${restaurantId}/pizza-options`);
  }

  // Add a new item, or update an existing one (send an `id` to update — e.g. price edits).
  saveMenuItem(restaurantId: string, item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.apiUrl}/restaurants/${restaurantId}/menu-items`, item);
  }

  deleteMenuItem(restaurantId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/restaurants/${restaurantId}/menu-items/${itemId}`);
  }

  updateAvailability(restaurantId: string, itemId: string, available: boolean): Observable<void> {
    const params = new HttpParams().set('available', available);
    return this.http.patch<void>(`${this.apiUrl}/restaurants/${restaurantId}/menu-items/${itemId}/availability`, null, { params });
  }

  updatePrice(restaurantId: string, itemId: string, price: number): Observable<MenuItem> {
    const params = new HttpParams().set('price', price);
    return this.http.patch<MenuItem>(`${this.apiUrl}/restaurants/${restaurantId}/menu-items/${itemId}/price`, null, { params });
  }

  importMenuOcr(restaurantId: string, file: File): Observable<any[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any[]>(`${this.apiUrl}/restaurants/${restaurantId}/menu/import-ocr`, formData);
  }
}
