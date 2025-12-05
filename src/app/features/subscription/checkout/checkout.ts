import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  
  planId: number = 0;
  plan: any = null;
  loading = true;
  metodoPago: 'paypal' | 'tarjeta' = 'paypal'; // Cambiado de paymentMethod
  procesandoPago = false;
  
  // Datos del usuario para la facturación
  datosFacturacion = {
    nombre: '',
    email: '',
    dni: ''
  };

  // Datos de tarjeta (si se selecciona)
  datosTarjeta = {
    numero: '',
    expiracion: '',
    cvv: '',
    nombre: ''
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('planId');
    this.planId = id ? parseInt(id) : 0;
    
    this.loadPlanDetails();
    this.loadUserData();
  }

  loadPlanDetails() {
    this.subscriptionService.getPlans().subscribe({
      next: (planes) => {
        this.plan = planes.find(p => p.id === this.planId);
        this.loading = false;
        
        if (!this.plan) {
          this.router.navigate(['/subscription/plans']);
        }
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/subscription/plans']);
      }
    });
  }

  loadUserData() {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.datosFacturacion = {
        nombre: user.name,
        email: user.email,
        dni: user.dni || ''
      };
    }
  }

  processPayment() {
    if (!this.plan) return;
    
    this.procesandoPago = true;
    
    const subscriptionData = {
      plan_id: this.plan.id,
      metodo_pago: this.metodoPago,
      datos_facturacion: this.datosFacturacion
    };

    this.subscriptionService.createSubscription(subscriptionData).subscribe({
      next: (response) => {
        // CORRECCIÓN: response.intencion_pago no es response directo
        if (this.metodoPago === 'paypal' && response.intencion_pago?.url_redireccion) {
          // Redirigir a PayPal
          window.location.href = response.intencion_pago.url_redireccion;
        } else if (this.metodoPago === 'tarjeta' && response.intencion_pago?.secreto_cliente) {
          // Procesar pago con tarjeta
          this.processCardPayment(response);
        } else if (response.intencion_pago?.intencion_pago_id) {
          // Pago manual o simulado
          this.completePayment(response.intencion_pago.intencion_pago_id);
        } else {
          this.procesandoPago = false;
          alert('No se pudo crear la intención de pago. Inténtalo de nuevo.');
        }
      },
      error: (error) => {
        console.error('Error creando pago:', error);
        this.procesandoPago = false;
        alert('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      }
    });
  }

  processCardPayment(paymentData: any) {
    // Validar datos de tarjeta
    if (!this.validateCardData()) {
      this.procesandoPago = false;
      alert('Por favor, completa todos los datos de la tarjeta correctamente.');
      return;
    }
    
    // Simular procesamiento de tarjeta
    if (paymentData.intencion_pago?.secreto_cliente) {
      // En un entorno real, integrarías con Stripe aquí
      setTimeout(() => {
        this.completePayment(
          paymentData.intencion_pago.intencion_pago_id || 
          paymentData.suscripcion?.transaccion_id || 
          'tarjeta_simulada_' + Date.now()
        );
      }, 1500);
    } else {
      this.procesandoPago = false;
      alert('Error en los datos de pago con tarjeta.');
    }
  }

  validateCardData(): boolean {
    if (this.metodoPago !== 'tarjeta') return true;
    
    const { numero, expiracion, cvv, nombre } = this.datosTarjeta;
    
    if (!numero || numero.replace(/\s/g, '').length !== 16) {
      return false;
    }
    
    if (!expiracion || !/^\d{2}\/\d{2}$/.test(expiracion)) {
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      return false;
    }
    
    if (!nombre || nombre.trim().length < 3) {
      return false;
    }
    
    return true;
  }

  completePayment(intencionPagoId: string) {
    this.subscriptionService.confirmPayment(intencionPagoId).subscribe({
      next: (response) => {
        if (response.exito) {
          // Actualizar estado del usuario
          const user = this.auth.getCurrentUser();
          if (user && response.suscripcion) {
            this.auth.updateUser({
              ...user,
              estado_suscripcion: 'activa',
              suscripcion_expira_en: response.suscripcion.expira_en,
              tiene_suscripcion_activa: true,
              plan_id: this.plan?.id,
              plan_nombre: this.plan?.nombre,
              plan_precio: this.plan?.precio
            });
          }
          
          // Redirigir a éxito
          this.router.navigate(['/subscription/success'], {
            queryParams: {
              suscripcion_id: response.suscripcion.id,
              plan: this.plan?.nombre
            }
          });
        } else {
          this.procesandoPago = false;
          alert('El pago no pudo ser confirmado. Por favor, contacta con soporte.');
        }
      },
      error: (error) => {
        console.error('Error confirmando pago:', error);
        this.procesandoPago = false;
        alert('Error al confirmar el pago. Por favor, inténtalo de nuevo.');
      }
    });
  }

  cancelCheckout() {
    this.router.navigate(['/subscription/plans']);
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    
    // Agrupar en bloques de 4
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limitar a 19 caracteres
    if (value.length > 19) {
      value = value.substring(0, 19);
    }
    
    this.datosTarjeta.numero = value;
  }

  formatExpiry(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    
    this.datosTarjeta.expiracion = value;
  }

  simulatePayment() {
    if (!this.plan) return;
    
    this.procesandoPago = true;
    
    this.subscriptionService.simulatePayment(this.plan.id).subscribe({
      next: (response) => {
        if (response.exito && response.suscripcion) {
          // Actualizar usuario
          const user = this.auth.getCurrentUser();
          if (user) {
            this.auth.updateUser({
              ...user,
              estado_suscripcion: 'activa',
              suscripcion_expira_en: response.suscripcion.expira_en,
              tiene_suscripcion_activa: true,
              plan_id: this.plan?.id,
              plan_nombre: this.plan?.nombre,
              plan_precio: this.plan?.precio
            });
          }
          
          this.router.navigate(['/subscription/success'], {
            queryParams: {
              suscripcion_id: response.suscripcion.id,
              plan: this.plan?.nombre
            }
          });
        } else {
          this.procesandoPago = false;
          alert('Error en la simulación de pago');
        }
      },
      error: (error) => {
        console.error('Error simulando pago:', error);
        this.procesandoPago = false;
        alert('Error al simular el pago');
      }
    });
  }
}