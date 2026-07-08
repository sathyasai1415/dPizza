import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StripeIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  createStripeIntent(orderId: string): Observable<StripeIntentResponse> {
    let params = new HttpParams().set('orderId', orderId);
    return this.http.post<StripeIntentResponse>(`${this.apiUrl}/stripe/create-intent`, null, { params });
  }

  confirmStripePayment(paymentIntentId: string): Observable<void> {
    let params = new HttpParams().set('paymentIntentId', paymentIntentId);
    return this.http.post<void>(`${this.apiUrl}/stripe/confirm`, null, { params });
  }
}
