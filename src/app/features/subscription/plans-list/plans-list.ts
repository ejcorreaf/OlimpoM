import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plans-list.html',
  styleUrls: ['./plans-list.scss']
})
export class PlansListComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  private router = inject(Router);
  
  loading = true;
  selectedPlanId: number | null = null;
  hasActiveSubscription = false;
  currentPlanId: number | null = null;
  currentPlanName: string = '';
  currentPlanPrice: number = 0;
  
  // Variables para el modal de cambio de plan
  showChangePlanModal = false;
  private changePlanIdStorage: number | null = null;
  changePlanPrice: number = 0;
  changePlanName: string = '';

  ngOnInit() {
    this.loadUserSubscription();
    this.loading = false;
  }

  loadUserSubscription() {
    this.subscriptionService.getUserSubscription().subscribe({
      next: (data) => {
        this.hasActiveSubscription = data.tiene_activa;
        if (data.suscripcion?.plan_id) {
          this.currentPlanId = data.suscripcion.plan_id;
          
          // Asignar nombre según el ID del plan
          if (this.currentPlanId === 1) {
            this.currentPlanName = 'Básico';
            this.currentPlanPrice = 9.99;
          } else if (this.currentPlanId === 2) {
            this.currentPlanName = 'Avanzado';
            this.currentPlanPrice = 19.99;
          } else {
            this.currentPlanName = 'Plan ' + this.currentPlanId;
            this.currentPlanPrice = 0;
          }
        }
      },
      error: () => {
        this.hasActiveSubscription = false;
        this.currentPlanId = null;
        this.currentPlanName = '';
        this.currentPlanPrice = 0;
      }
    });
  }

  selectPlan(planId: number) {
    // Solo permitir seleccionar si no es el plan actual
    if (!this.isCurrentUserPlan(planId) && planId !== 3) { // 3 es el plan Autodidacta
      this.selectedPlanId = planId;
    }
  }

  isCurrentUserPlan(planId: number): boolean {
    return this.currentPlanId === planId;
  }

  getCurrentPlanName(): string {
    return this.currentPlanName || 'Tu Plan Actual';
  }

  isUpgrade(newPrice: number): boolean {
    if (!this.currentPlanPrice) return true;
    return newPrice > this.currentPlanPrice;
  }

  changePlan(planId: number, price: number, name: string) {
    // No permitir cambiar al mismo plan
    if (this.isCurrentUserPlan(planId)) {
      alert('Ya tienes este plan activo');
      return;
    }
    
    // No permitir cambiar al plan Autodidacta (ID 3)
    if (planId === 3) {
      alert('El plan Autodidacta está disponible próximamente');
      return;
    }
    
    // Guardar los datos del plan a cambiar
    this.changePlanIdStorage = planId;
    this.changePlanPrice = price;
    this.changePlanName = name;
    this.showChangePlanModal = true;
  }

  // Getter para acceder de forma segura al ID del plan
  get changePlanId(): number | null {
    return this.changePlanIdStorage;
  }

  closeChangePlanModal() {
    this.showChangePlanModal = false;
    // Limpiar después de un breve delay para evitar problemas con el modal
    setTimeout(() => {
      this.changePlanIdStorage = null;
      this.changePlanPrice = 0;
      this.changePlanName = '';
    }, 100);
  }

  onModalClick(event: MouseEvent) {
    // Cerrar modal al hacer clic fuera del contenido
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeChangePlanModal();
    }
  }

  proceedToCheckout(planId: number) {
    if (!planId) {
      console.error('planId es null o undefined');
      return;
    }
    
    console.log('Cambiando al plan:', planId);
    
    // Cerrar el modal primero
    this.closeChangePlanModal();
    
    // Esperar un momento para que el modal se cierre completamente
    setTimeout(() => {
      // Redirigir a checkout con el nuevo plan
      this.router.navigate(['/subscription/checkout', planId]);
    }, 300);
  }

  // Helper para debug
  debugInfo() {
    return {
      currentPlanId: this.currentPlanId,
      currentPlanName: this.currentPlanName,
      currentPlanPrice: this.currentPlanPrice,
      hasActiveSubscription: this.hasActiveSubscription,
      changePlanId: this.changePlanId,
      changePlanName: this.changePlanName,
      changePlanPrice: this.changePlanPrice,
      showChangePlanModal: this.showChangePlanModal
    };
  }
}