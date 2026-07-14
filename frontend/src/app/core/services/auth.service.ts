import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, tap, catchError, throwError, of, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, UserProfile } from '../../shared/models';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly firebaseApp = initializeApp(environment.firebase);
  private readonly firebaseAuth = getAuth(this.firebaseApp);

  // Reactive state using Angular Signals
  readonly currentUser = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.roles.includes('ADMIN') ?? false);
  readonly isStoreOwner = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    return roles.includes('RESTAURANT_OWNER') || roles.includes('RESTAURANT_STAFF');
  });

  constructor() {
    this.loadCachedSession();
    this.firebaseAuth.onIdTokenChanged(async (user: FirebaseUser | null) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('mislice_token', token);
      } else {
        this.clearSession();
      }
    });
  }

  private loadCachedSession() {
    const cachedUser = localStorage.getItem('mislice_user');
    const token = localStorage.getItem('mislice_token');
    if (cachedUser && token) {
      try {
        this.currentUser.set(JSON.parse(cachedUser));
      } catch {
        this.clearSession();
      }
    }
  }

  register(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role: string = 'CUSTOMER',
    restaurantName?: string,
    addressLine?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    description?: string,
    website?: string
  ): Observable<AuthResponse> {
    return from(createUserWithEmailAndPassword(this.firebaseAuth, email, password)).pipe(
      switchMap(async (cred) => {
        const token = await cred.user.getIdToken();
        const body = {
          email,
          uid: cred.user.uid,
          fullName,
          phone,
          requestedRole: role,
          restaurantName,
          addressLine,
          city,
          state,
          postalCode,
          description,
          website
        };
        return { token, body };
      }),
      switchMap(({ token, body }) => {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, body).pipe(
          tap(res => {
            const finalRes: AuthResponse = {
              accessToken: token,
              refreshToken: '',
              user: res.user
            };
            this.saveSession(finalRes);
          })
        );
      }),
      catchError(err => throwError(() => err))
    );
  }

  registerSocialUser(
    uid: string,
    email: string,
    fullName: string,
    role: string,
    phone?: string,
    restaurantName?: string,
    addressLine?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    description?: string,
    website?: string
  ): Observable<AuthResponse> {
    const user = this.firebaseAuth.currentUser;
    if (!user) {
      return throwError(() => new Error('No social login active.'));
    }
    return from(user.getIdToken()).pipe(
      switchMap(token => {
        const body = {
          email,
          uid,
          fullName,
          phone,
          requestedRole: role,
          restaurantName,
          addressLine,
          city,
          state,
          postalCode,
          description,
          website
        };
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, body).pipe(
          tap(res => {
            const finalRes: AuthResponse = {
              accessToken: token,
              refreshToken: '',
              user: res.user
            };
            this.saveSession(finalRes);
          })
        );
      }),
      catchError(err => throwError(() => err))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return from(signInWithEmailAndPassword(this.firebaseAuth, email, password)).pipe(
      switchMap(async (cred) => {
        const token = await cred.user.getIdToken();
        return { token };
      }),
      switchMap(({ token }) => {
        const body = { email, idToken: token };
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, body).pipe(
          tap(res => {
            const finalRes: AuthResponse = {
              accessToken: token,
              refreshToken: '',
              user: res.user
            };
            this.saveSession(finalRes);
          })
        );
      }),
      catchError(err => throwError(() => err))
    );
  }

  demoLogin(role: string): Observable<AuthResponse> {
    const body = { role };
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/demo-login`, body).pipe(
      tap(res => {
        this.saveSession(res);
      }),
      catchError(err => throwError(() => err))
    );
  }

  resolveStoreOwnerEmail(storeId: string): Observable<{ email: string }> {
    return this.http.get<{ email: string }>(`${this.apiUrl}/auth/resolve-store-owner`, {
      params: { storeId }
    });
  }

  loginWithGoogle(): Observable<AuthResponse> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.firebaseAuth, provider)).pipe(
      switchMap(async (cred) => {
        const token = await cred.user.getIdToken();
        return { token, email: cred.user.email, name: cred.user.displayName, uid: cred.user.uid };
      }),
      switchMap(({ token, email, name, uid }) => {
        const body = { email: email || '', idToken: token };
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, body).pipe(
          map(res => {
            const finalRes: AuthResponse = {
              accessToken: token,
              refreshToken: '',
              user: res.user,
              roleRequired: res.roleRequired
            };
            if (!res.roleRequired) {
              this.saveSession(finalRes);
            }
            return finalRes;
          })
        );
      }),
      catchError(err => throwError(() => err))
    );
  }

  refreshSession(): Observable<AuthResponse | null> {
    const user = this.firebaseAuth.currentUser;
    if (!user) {
      this.clearSession();
      return of(null);
    }
    return from(user.getIdToken(true)).pipe(
      switchMap(token => {
        localStorage.setItem('mislice_token', token);
        const cachedUser = localStorage.getItem('mislice_user');
        if (cachedUser) {
          const profile = JSON.parse(cachedUser) as UserProfile;
          return of({
            accessToken: token,
            refreshToken: '',
            user: profile
          } as AuthResponse);
        }
        return of(null);
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  sendPasswordReset(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.firebaseAuth, email));
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me`);
  }

  logout(): Observable<void> {
    return from(signOut(this.firebaseAuth)).pipe(
      tap(() => this.clearSession()),
      switchMap(() => of(void 0)),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      })
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('mislice_user', JSON.stringify(user));
      })
    );
  }

  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/users/me`, profile).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('mislice_user', JSON.stringify(user));
      })
    );
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem('mislice_token', res.accessToken);
    localStorage.setItem('mislice_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearSession() {
    localStorage.removeItem('mislice_token');
    localStorage.removeItem('mislice_user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('mislice_token');
  }
}
