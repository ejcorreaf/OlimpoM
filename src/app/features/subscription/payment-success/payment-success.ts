import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.scss']
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  
  subscriptionId: string = '';
  planName: string = '';
  orderId: string = '';
  loading = true;
  paymentProcessed = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Obtener parámetros de PayPal
      this.orderId = params['token'] || ''; // PayPal pasa 'token' no 'subscription_id'
      
      // Intentar obtener de localStorage si no hay en URL
      const lastOrder = localStorage.getItem('last_paypal_order');
      if (lastOrder && !this.orderId) {
        const orderData = JSON.parse(lastOrder);
        this.orderId = orderData.order_id;
        this.planName = orderData.plan_name;
      }
      
      if (this.orderId) {
        this.capturePayment();
      } else {
        this.loading = false;
        alert('No se pudo identificar la orden de pago');
        this.router.navigate(['/subscription/plans']);
      }
    });
  }

  capturePayment() {
    this.subscriptionService.capturePayPalOrder(this.orderId).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.exito && response.suscripcion) {
          this.paymentProcessed = true;
          this.subscriptionId = response.suscripcion.id.toString();
          this.planName = response.suscripcion.plan?.nombre || this.planName;
          
          // Actualizar estado del usuario
          const user = this.auth.getCurrentUser();
          if (user) {
            this.auth.updateUser({
              ...user,
              estado_suscripcion: 'activa',
              suscripcion_expira_en: response.suscripcion.expira_en,
              tiene_suscripcion_activa: true,
              plan_id: response.suscripcion.plan_id,
              plan_nombre: response.suscripcion.plan?.nombre,
              plan_precio: response.suscripcion.plan?.precio
            });
          }
          
          // Limpiar localStorage
          localStorage.removeItem('last_paypal_order');
        } else {
          alert('Error al procesar el pago: ' + (response.message || 'Inténtalo de nuevo'));
          this.router.navigate(['/subscription/plans']);
        }
      },
      error: (error) => {
        console.error('Error capturando pago:', error);
        this.loading = false;
        alert('Error al verificar el pago: ' + (error.error?.message || error.message));
        this.router.navigate(['/subscription/plans']);
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/trainee/home']);
  }

  goToRoutines() {
    this.router.navigate(['/trainee/rutinas']);
  }
}