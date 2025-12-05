import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Plan, SubscriptionService } from '../../../core/services/subscription';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plans-list.html',
  styleUrls: ['./plans-list.scss']
})
export class PlansListComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  
  plans: Plan[] = [];
  loading = true;
  selectedPlanId: number | null = null;

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loading = true;
    this.subscriptionService.getPlans().subscribe({
      next: (data) => {
        this.plans = data.filter(plan => plan.activo);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando planes:', error);
        this.loading = false;
      }
    });
  }

  selectPlan(planId: number) {
    this.selectedPlanId = planId;
  }

  getFeaturesList(features: string[]): string[] {
    return features || [
      'Acceso completo a rutinas',
      'Seguimiento de progreso',
      'Chat con entrenador',
      'Recordatorios automáticos',
      'App móvil incluida'
    ];
  }
}