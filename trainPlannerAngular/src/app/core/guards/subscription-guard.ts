import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const subscriptionGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const user = auth.getCurrentUser();
  
  if (!user) {
    return router.parseUrl('/login');
  } 
  
  // Solo aplica a trainees
  if (user.role !== 'trainee') {
    return true;
  }
  
  // Verificar si tiene suscripción activa
  if (!user.tiene_suscripcion_activa && user.estado_suscripcion !== 'activa') {
    // Redirigir a planes si no tiene suscripción
    return router.parseUrl('/subscription/plans');
  }
  
  return true;
};