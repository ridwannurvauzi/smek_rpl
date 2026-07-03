import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.currentUserValue) {
    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles) {
      if (requiredRoles.includes(authService.currentUserValue.role)) {
        return true;
      } else {
        router.navigate(['/']); // Redirect to home/login if unauthorized
        return false;
      }
    }
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
