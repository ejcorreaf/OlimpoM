import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, tap, take } from 'rxjs';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.user$.pipe(
      take(1),
      map(user => !!user && roles.includes(user.role)),
      tap(isAllowed => {
        if (!isAllowed) {
          router.navigate(['/']);
        }
      })
    );
  };
};
