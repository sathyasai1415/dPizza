import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Store, Address, Deal } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurants`;

  getRestaurants(city?: string): Observable<Store[]> {
    let params = new HttpParams();
    if (city) {
      params = params.set('city', city);
    }
    return this.http.get<Store[]>(this.apiUrl, { params });
  }

  getCities(): Observable<String[]> {
    return this.http.get<String[]>(`${this.apiUrl}/cities`);
  }

  getRestaurantBySlug(slug: string): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/slug/${slug}`);
  }

  getRestaurantById(id: string): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/${id}`);
  }

  getHours(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/hours`);
  }

  getDeliveryZones(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/zones`);
  }

  getActiveDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>(`${this.apiUrl}/deals`);
  }

  getRestaurantDeals(id: string): Observable<Deal[]> {
    return this.http.get<Deal[]>(`${this.apiUrl}/${id}/deals`);
  }

  updateRestaurant(id: string, dto: Partial<Store>): Observable<Store> {
    return this.http.put<Store>(`${this.apiUrl}/${id}`, dto);
  }

  saveDeal(id: string, deal: Partial<Deal>): Observable<Deal> {
    return this.http.post<Deal>(`${this.apiUrl}/${id}/deals`, deal);
  }
}
