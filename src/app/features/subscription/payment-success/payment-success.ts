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
  loading = true;
  paymentProcessed = false;
  isStripePayment = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log('Parámetros de URL:', params);
      
      // Para PayPal: token viene en la URL
      // Para Stripe: no viene nada, el pago ya se procesó
      const paypalToken = params['token'];
      const subscriptionId = params['subscription_id'];
      this.planName = params['plan'] || '';
      
      if (paypalToken || subscriptionId) {
        // Es un pago de PayPal que necesita captura
        this.capturePayPalPayment(paypalToken || subscriptionId);
      } else {
        // Es un pago de Stripe que ya se procesó
        this.isStripePayment = true;
        this.loading = false;
        this.paymentProcessed = true;
        
        // Mostrar información de la última suscripción
        this.showLastSubscriptionInfo();
      }
    });
  }

  capturePayPalPayment(orderId: string) {
    this.subscriptionService.capturePayPalOrder(orderId).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.exito && response.suscripcion) {
          this.paymentProcessed = true;
          this.subscriptionId = response.suscripcion.id.toString();
          this.planName = response.suscripcion.plan?.nombre || this.planName;
          
          // Actualizar estado del usuario
          this.updateUserAfterPayment(response.suscripcion);
          
          // Limpiar localStorage
          localStorage.removeItem('last_paypal_order');
        } else {
          this.showError('Error al procesar el pago: ' + (response.message || 'Inténtalo de nuevo'));
        }
      },
      error: (error) => {
        console.error('Error capturando pago:', error);
        this.loading = false;
        this.showError('Error al verificar el pago: ' + (error.error?.message || error.message));
      }
    });
  }

  showLastSubscriptionInfo() {
    // Intentar obtener información de la última suscripción
    this.subscriptionService.getUserSubscription().subscribe({
      next: (response) => {
        if (response.suscripcion) {
          this.subscriptionId = response.suscripcion.id.toString();
          this.planName = response.suscripcion.plan?.nombre || this.planName;
        }
      },
      error: (error) => {
        console.error('Error obteniendo suscripción:', error);
      }
    });
  }

  updateUserAfterPayment(suscripcion: any) {
    const user = this.auth.getCurrentUser();
    if (user && suscripcion) {
      this.auth.updateUser({
        ...user,
        estado_suscripcion: 'activa',
        suscripcion_expira_en: suscripcion.expira_en,
        tiene_suscripcion_activa: true,
        plan_id: suscripcion.plan_id,
        plan_nombre: suscripcion.plan?.nombre,
        plan_precio: suscripcion.plan?.precio
      });
    }
  }

  showError(message: string) {
    alert(message);
    this.router.navigate(['/subscription/plans']);
  }

  goToDashboard() {
    this.router.navigate(['/trainee/home']);
  }

  goToRoutines() {
    this.router.navigate(['/trainee/rutinas']);
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }
}