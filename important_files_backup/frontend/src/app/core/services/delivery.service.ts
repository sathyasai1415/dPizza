import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeliveryDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/deliveries`;

  getDeliveryByOrderId(orderId: string): Observable<DeliveryDto> {
    return this.http.get<DeliveryDto>(`${this.apiUrl}/orders/${orderId}`);
  }

  assignDriver(deliveryId: string, driverId: string): Observable<DeliveryDto> {
    let params = new HttpParams().set('driverId', driverId);
    return this.http.post<DeliveryDto>(`${this.apiUrl}/${deliveryId}/assign`, null, { params });
  }

  updateDeliveryStatus(deliveryId: string, status: string): Observable<DeliveryDto> {
    let params = new HttpParams().set('status', status);
    return this.http.put<DeliveryDto>(`${this.apiUrl}/${deliveryId}/status`, null, { params });
  }

  updateDriverLocation(driverId: string, lat: number, lng: number): Observable<void> {
    let params = new HttpParams().set('lat', lat.toString()).set('lng', lng.toString());
    return this.http.put<void>(`${this.apiUrl}/drivers/${driverId}/location`, null, { params });
  }
}
