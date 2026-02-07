import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take, switchMap } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'];
  
  if (!requiredRole) {
    console.error('RoleGuard: No role specified in route data');
    router.navigate(['/']);
    return false;
  }

  return auth.user$.pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        router.navigate(['/login']);
        return [false];
      }

      if (user.role === requiredRole) {
        return [true];
      }

      // Redirigir al home correspondiente del usuario
      switch(user.role) {
        case 'admin':
          router.navigate(['/admin/home']);
          break;
        case 'trainer':
          router.navigate(['/entrenador/home']);
          break;
        case 'trainee':
          router.navigate(['/trainee/home']);
          break;
        default:
          router.navigate(['/']);
      }
      return [false];
    })
  );
};