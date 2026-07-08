import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Store } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurants`;

  getAllRestaurants(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/admin`);
  }

  approveRestaurant(id: string): Observable<Store> {
    return this.http.put<Store>(`${this.apiUrl}/${id}/approve`, null);
  }

  rejectRestaurant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
