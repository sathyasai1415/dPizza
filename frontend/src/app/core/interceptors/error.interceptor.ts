import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        return authService.refreshSession().pipe(
          switchMap((res) => {
            if (res) {
              // Retry failed request with new token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.accessToken}`
                }
              });
              return next(retryReq);
            }
            authService.logout().subscribe();
            router.navigate(['/welcome']);
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            authService.logout().subscribe();
            router.navigate(['/welcome']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
