import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentMethodDto } from '../../shared/models';

/**
 * Saved payment methods — masked metadata only (brand/last4/expiry). No raw
 * card numbers or CVV are ever sent to or stored by the backend; a live charge
 * still requires a real processor integration (e.g. Stripe Elements).
 */
@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users/me/payment-methods`;

  list(): Observable<PaymentMethodDto[]> {
    return this.http.get<PaymentMethodDto[]>(this.apiUrl);
  }

  add(method: Partial<PaymentMethodDto>): Observable<PaymentMethodDto> {
    return this.http.post<PaymentMethodDto>(this.apiUrl, method);
  }

  setDefault(id: string): Observable<PaymentMethodDto> {
    return this.http.put<PaymentMethodDto>(`${this.apiUrl}/${id}/default`, null);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
