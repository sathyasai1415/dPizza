import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoyaltyAccountDto, LoyaltyTransactionDto } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/loyalty`;

  getAccount(): Observable<LoyaltyAccountDto> {
    return this.http.get<LoyaltyAccountDto>(this.apiUrl);
  }

  getTransactions(): Observable<LoyaltyTransactionDto[]> {
    return this.http.get<LoyaltyTransactionDto[]>(`${this.apiUrl}/transactions`);
  }

  redeem(points: number, description: string): Observable<void> {
    const params = new HttpParams().set('points', points).set('description', description);
    return this.http.post<void>(`${this.apiUrl}/redeem`, null, { params });
  }
}
