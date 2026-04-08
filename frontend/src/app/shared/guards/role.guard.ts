import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanMatchFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];
  const role = (auth.currentUser()?.role as string | undefined)?.toUpperCase() ?? '';

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if (allowed.length === 0) {
    return true;
  }
  if (allowed.includes(role)) {
    return true;
  }
  router.navigate(['/pos-layout/dashboard']);
  return false;
};
