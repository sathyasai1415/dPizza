import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = (roles?: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/welcome']);
      return false;
    }

    if (roles && roles.length > 0) {
      const userRoles = authService.currentUser()?.roles ?? [];
      const hasRole = roles.some(r => userRoles.includes(r));
      if (!hasRole) {
        router.navigate(['/home']);
        return false;
      }
    }

    return true;
  };
};
