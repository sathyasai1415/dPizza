import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PayoutDto {
  id: string;
  restaurantId: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
  status: string;
  paidAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayoutService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payouts`;

  getPayouts(restaurantId: string): Observable<PayoutDto[]> {
    return this.http.get<PayoutDto[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
  }

  requestPayout(restaurantId: string, amount: number): Observable<PayoutDto> {
    return this.http.post<PayoutDto>(`${this.apiUrl}/request/${restaurantId}`, { amount });
  }
}
