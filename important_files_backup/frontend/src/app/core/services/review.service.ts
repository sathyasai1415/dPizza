import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReviewDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reviews`;

  getReviewsForRestaurant(restaurantId: string): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.apiUrl}/restaurants/${restaurantId}`);
  }

  submitReview(req: any): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(this.apiUrl, req);
  }
}
