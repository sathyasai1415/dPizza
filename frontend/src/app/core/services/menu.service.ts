import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
