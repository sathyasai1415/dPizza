import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoyaltyAccountDto {
  id: string;
  points: number;
  lifetimePoints: number;
  referralCode: string;
}

export interface LoyaltyTransactionDto {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class RewardsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/loyalty`;

  getMyAccount(): Observable<LoyaltyAccountDto> {
    return this.http.get<LoyaltyAccountDto>(this.apiUrl);
  }

  getMyTransactions(): Observable<LoyaltyTransactionDto[]> {
    return this.http.get<LoyaltyTransactionDto[]>(`${this.apiUrl}/transactions`);
  }

  redeemPoints(points: number, description: string): Observable<void> {
    let params = new HttpParams()
      .set('points', points.toString())
      .set('description', description);
    return this.http.post<void>(`${this.apiUrl}/redeem`, null, { params });
  }
}
