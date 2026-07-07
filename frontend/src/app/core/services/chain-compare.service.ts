import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChainDto, Quote } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ChainCompareService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/compare`;

  comparePizzas(config: any, deliveryType: string = 'delivery'): Observable<Quote[]> {
    let params = new HttpParams().set('deliveryType', deliveryType);
    return this.http.post<Quote[]>(this.apiUrl, config, { params });
  }

  getChains(): Observable<ChainDto[]> {
    return this.http.get<ChainDto[]>(`${this.apiUrl}/chains`);
  }
}
