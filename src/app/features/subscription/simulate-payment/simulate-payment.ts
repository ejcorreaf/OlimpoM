import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { SubscriptionService } from '../../../core/services/subscription';

@Component({
  selector: 'app-simulate-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header bg-warning">
              <h5 class="card-title mb-0">Simulación de Pago (Desarrollo)</h5>
            </div>
            <div class="card-body">
              <p class="text-muted mb-4">
                Este componente solo está disponible en modo desarrollo para 
                simular pagos sin necesidad de integración con PayPal.
              </p>
              
              <div class="mb-4">
                <label class="form-label">Selecciona un plan</label>
                <select class="form-select" [(ngModel)]="selectedPlanId">
                  <option [value]="1">Plan Básico (2 días/semana) - 9.99€</option>
                  <option [value]="2">Plan Premium (3-5 días/semana) - 14.99€</option>
                </select>
              </div>
              
              <div class="d-grid gap-2">
                <button class="btn btn-success" (click)="simulateSuccess()" [disabled]="processing">
                  Simular Pago Exitoso
                </button>
                <button class="btn btn-danger" (click)="simulateFailure()" [disabled]="processing">
                  Simular Pago Fallido
                </button>
                <button class="btn btn-outline-secondary" (click)="goBack()">
                  Volver
                </button>
              </div>
              
              @if (message) {
                <div class="alert alert-info mt-3">
                  {{ message }}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SimulatePaymentComponent {
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  
  selectedPlanId = 1;
  processing = false;
  message = '';

  simulateSuccess() {
    this.processing = true;
    this.message = 'Simulando pago exitoso...';
    
    // Simular delay
    setTimeout(() => {
      this.subscriptionService.simulatePayment(this.selectedPlanId).subscribe({
        next: (response) => {
          if (response.exito) {
            this.auth.updateUserSubscriptionStatus('activa', response.suscripcion.expira_en);
            this.router.navigate(['/subscription/success'], {
              queryParams: {
                subscription_id: response.suscripcion.id,
                plan: this.selectedPlanId === 1 ? 'Básico' : 'Premium'
              }
            });
          }
        },
        error: () => {
          this.processing = false;
          this.message = 'Error en la simulación';
        }
      });
    }, 1500);
  }

  simulateFailure() {
    this.message = 'Simulando pago fallido... Redirigiendo...';
    setTimeout(() => {
      this.router.navigate(['/subscription/cancel']);
    }, 1500);
  }

  goBack() {
    this.router.navigate(['/subscription/plans']);
  }
}