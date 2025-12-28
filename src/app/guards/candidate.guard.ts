import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const candidateGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Store the attempted URL to redirect after login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Get current user to ensure token is decoded
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    // User data not available, redirect to login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!authService.isCandidate()) {
    // User is logged in but not a candidate
    console.log('User role:', currentUser.role, 'Expected: CANDIDATE');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

