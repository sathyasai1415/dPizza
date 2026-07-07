import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartDto, CartItemDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/carts/me`;

  readonly cart = signal<CartDto | null>(null);
  readonly items = computed<CartItemDto[]>(() => this.cart()?.items ?? []);
  readonly cartItemCount = computed(() => this.items().reduce((sum: number, item: CartItemDto) => sum + item.quantity, 0));

  loadCart(): Observable<CartDto> {
    return this.http.get<CartDto>(this.apiUrl).pipe(
      tap(cart => this.cart.set(cart))
    );
  }

  addToCart(req: any): Observable<CartDto> {
    return this.http.post<CartDto>(`${this.apiUrl}/items`, req).pipe(
      tap(cart => this.cart.set(cart))
    );
  }

  updateCartItem(itemId: string, quantity: number, notes?: string): Observable<CartDto> {
    let params = new HttpParams().set('quantity', quantity.toString());
    if (notes) {
      params = params.set('notes', notes);
    }
    return this.http.put<CartDto>(`${this.apiUrl}/items/${itemId}`, null, { params }).pipe(
      tap(cart => this.cart.set(cart))
    );
  }

  removeFromCart(itemId: string): Observable<CartDto> {
    return this.http.delete<CartDto>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(cart => this.cart.set(cart))
    );
  }

  applyCoupon(code: string): Observable<CartDto> {
    let params = new HttpParams().set('code', code);
    return this.http.post<CartDto>(`${this.apiUrl}/coupon`, null, { params }).pipe(
      tap(cart => this.cart.set(cart))
    );
  }

  clearCart(): Observable<CartDto> {
    return this.http.delete<CartDto>(this.apiUrl).pipe(
      tap(cart => this.cart.set(cart))
    );
  }
}
