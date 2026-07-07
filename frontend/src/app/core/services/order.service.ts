import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  placeOrder(req: any): Observable<OrderDto> {
    return this.http.post<OrderDto>(this.apiUrl, req);
  }

  getMyOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiUrl}/me`);
  }

  getRestaurantOrders(restaurantId: string): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiUrl}/restaurants/${restaurantId}`);
  }

  getOrderByNumber(orderNumber: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/number/${orderNumber}`);
  }

  updateOrderStatus(orderId: string, status: string, changedBy?: string, note?: string): Observable<OrderDto> {
    let params = new HttpParams().set('status', status);
    if (changedBy) params = params.set('changedBy', changedBy);
    if (note) params = params.set('note', note);
    return this.http.put<OrderDto>(`${this.apiUrl}/${orderId}/status`, null, { params });
  }
}
