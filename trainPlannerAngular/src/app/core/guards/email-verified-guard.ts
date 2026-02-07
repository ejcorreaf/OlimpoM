import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, tap } from 'rxjs';

export const emailVerifiedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    map(user => {
      if (!user) return false;
      
      const role = auth.getUserRole();
      const isVerified = auth.isEmailVerified();
      
      // Solo los trainees necesitan verificación
      if (role === 'trainee' && !isVerified) {
        return false;
      }
      
      return true;
    }),
    tap(hasAccess => {
      if (!hasAccess) {
        router.navigate(['/perfil'], { 
          queryParams: { needsVerification: true } 
        });
      }
    })
  );
};