import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService, CreateSubscriptionDto } from '../../../core/services/subscription';
import { AuthService } from '../../../core/services/auth';
import { firstValueFrom } from 'rxjs';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { StripeElements } from '@stripe/stripe-js';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  
  planId: number = 0;
  plan: any = null;
  loading = true;
  metodoPago: 'paypal' | 'tarjeta' = 'paypal';
  procesandoPago = false;
  aceptoTerminos = false;
  mostrarErrorTerminos = false;
  showTermsModal = false;
  showPrivacyModal = false;
  
  // Stripe
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  card: StripeCardElement | null = null;
  cardError: string = '';
  stripeInitialized = false;
  
  // Datos del usuario para la facturación
  datosFacturacion = {
    nombre: '',
    email: '',
    dni: ''
  };

  // Guardar tarjeta para futuros pagos
  savePaymentMethod = false;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('planId');
    this.planId = id ? parseInt(id) : 0;
    
    this.loadPlanDetails();
    this.loadUserData();
  }

  async ngAfterViewInit() {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
      if (this.metodoPago === 'tarjeta' && !this.stripeInitialized) {
        this.initializeStripe();
      }
    }, 100);
  }

  async initializeStripe() {
    if (this.stripeInitialized) return;
    
    try {
      // Obtener clave pública desde backend
      const keyResponse = await firstValueFrom(
        this.subscriptionService.getStripePublicKey()
      );
      
      if (!keyResponse?.public_key) {
        console.error('No se pudo obtener la clave pública de Stripe');
        return;
      }
      
      this.stripe = await loadStripe(keyResponse.public_key);
      
      if (this.stripe) {
        this.elements = this.stripe.elements();
        await this.createCardElement();
        this.stripeInitialized = true;
      }
    } catch (error) {
      console.error('Error inicializando Stripe:', error);
    }
  }

  async createCardElement() {
    if (!this.stripe || !this.elements) return;
    
    // Verificar que el contenedor existe
    const cardElementContainer = document.getElementById('card-element-container');
    if (!cardElementContainer) {
      console.error('No se encontró el contenedor para Stripe Elements');
      return;
    }
    
    // Crear elemento de tarjeta
    this.card = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          },
          lineHeight: '1.5'
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      },
      hidePostalCode: true,
      classes: {
        base: 'StripeElement',
        complete: 'StripeElement--complete',
        empty: 'StripeElement--empty',
        focus: 'StripeElement--focus',
        invalid: 'StripeElement--invalid',
        webkitAutofill: 'StripeElement--webkit-autofill'
      }
    });
    
    // Montar el elemento
    this.card.mount('#card-element');
    
    // Escuchar cambios
    this.card.on('change', (event) => {
      if (event.error) {
        this.cardError = event.error.message || '';
      } else {
        this.cardError = '';
      }
    });
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
    
    // Validar términos y condiciones
    if (!this.aceptoTerminos) {
      this.mostrarErrorTerminos = true;
      // Scroll al checkbox
      const termsElement = document.getElementById('terms');
      if (termsElement) {
        termsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        termsElement.focus();
      }
      return;
    }
    
    this.mostrarErrorTerminos = false;
    this.procesandoPago = true;
    
    if (this.metodoPago === 'paypal') {
      this.processPayPalPayment();
    } else if (this.metodoPago === 'tarjeta') {
      this.processStripePayment();
    }
  }

  processPayPalPayment() {
    const paypalData: CreateSubscriptionDto = {
      plan_id: this.plan.id,
      metodo_pago: 'paypal',
      datos_facturacion: this.datosFacturacion
    };

    this.subscriptionService.createPayPalOrder(paypalData).subscribe({
      next: (response) => {
        console.log('Respuesta PayPal:', response);
        if (response.approval_url) {
          // Guardar order_id en localStorage para después
          localStorage.setItem('last_paypal_order', JSON.stringify({
            order_id: response.order_id,
            plan_id: this.plan?.id,
            plan_name: this.plan?.nombre
          }));
          
          // Redirigir a PayPal
          window.location.href = response.approval_url;
        } else {
          this.procesandoPago = false;
          alert('No se pudo crear la orden de PayPal');
        }
      },
      error: (error) => {
        console.error('Error creando orden PayPal:', error);
        this.procesandoPago = false;
        alert('Error al procesar el pago con PayPal: ' + (error.error?.message || error.message));
      }
    });
  }

  async processStripePayment() {
    console.log('=== INICIO processStripePayment ===');
    
    if (!this.plan || !this.stripe || !this.card) {
      const errorMsg = 'Error: Stripe no está configurado correctamente';
      console.error(errorMsg, {
        plan: !!this.plan,
        stripe: !!this.stripe,
        card: !!this.card
      });
      alert(errorMsg);
      this.procesandoPago = false;
      return;
    }

    try {
      console.log('1. Validando datos de facturación...');
      
      // Validar que el nombre esté completo
      if (!this.datosFacturacion.nombre.trim()) {
        this.cardError = 'Por favor, introduce tu nombre completo';
        this.procesandoPago = false;
        return;
      }

      console.log('2. Creando Payment Intent en backend...', {
        plan_id: this.plan.id,
        precio: this.plan.precio,
        datos_facturacion: this.datosFacturacion
      });

      // 1. Crear Payment Intent en el backend
      const subscriptionData = {
        plan_id: this.plan.id,
        datos_facturacion: this.datosFacturacion,
        save_payment_method: this.savePaymentMethod
      };

      const response = await firstValueFrom(
        this.subscriptionService.createStripePaymentIntent(subscriptionData)
      );
      
      console.log('3. Respuesta createStripePaymentIntent:', response);
      
      if (!response?.payment_intent?.client_secret) {
        throw new Error('No se pudo crear la intención de pago. Respuesta: ' + JSON.stringify(response));
      }

      console.log('4. Client secret obtenido, confirmando con Stripe...');
      
      // 2. Confirmar el pago con Stripe
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        response.payment_intent.client_secret,
        {
          payment_method: {
            card: this.card,
            billing_details: {
              name: this.datosFacturacion.nombre.trim(),
              email: this.datosFacturacion.email,
            }
          },
          // Agregar esto para mejor manejo de errores
          return_url: window.location.origin + '/subscription/success'
        }
      );

      console.log('5. Resultado confirmCardPayment:', { error, paymentIntent });

      if (error) {
        console.error('Error de Stripe en confirmCardPayment:', error);
        this.cardError = error.message || 'Error en el pago';
        this.procesandoPago = false;
        alert(`Error de Stripe: ${error.message}`);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('6. Pago exitoso, confirmando en backend...', {
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentIntent.payment_method
        });

        // 3. Confirmar en nuestro backend
        const confirmResponse = await firstValueFrom(
          this.subscriptionService.confirmStripePayment({
            payment_intent_id: paymentIntent.id,
            payment_method_id: paymentIntent.payment_method as string
          })
        );

        console.log('7. Respuesta confirmStripePayment:', confirmResponse);

        if (confirmResponse?.exito) {
          console.log('8. Éxito completo, manejando respuesta...');
          this.handleSuccessfulPayment(confirmResponse);
        } else {
          const errorMsg = confirmResponse?.message || 'Error al confirmar el pago en el servidor';
          console.error('Error en confirmResponse:', errorMsg);
          this.cardError = errorMsg;
          this.procesandoPago = false;
          alert(`Error del servidor: ${errorMsg}`);
        }
      } else {
        const errorMsg = `El pago no se completó correctamente. Estado: ${paymentIntent?.status}`;
        console.warn('Pago no completado:', paymentIntent);
        this.cardError = errorMsg;
        this.procesandoPago = false;
        alert(errorMsg);
      }

    } catch (error: any) {
      console.error('=== ERROR EN processStripePayment ===', error);
      console.error('Error completo:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response
      });
      
      // Mostrar error específico
      let errorMessage = 'Error inesperado al procesar el pago';
      
      if (error.message.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica tu internet o si el servidor está corriendo.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Endpoint no encontrado. Verifica las rutas del backend.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Error interno del servidor. Revisa los logs de Laravel.';
      } else if (error.message.includes('card_declined')) {
        errorMessage = 'Tarjeta rechazada. Usa una tarjeta de prueba válida.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      this.cardError = errorMessage;
      this.procesandoPago = false;
      alert(`Error: ${errorMessage}`);
      
      // Si es un error de tarjeta, mostrar opciones
      if (error.message.toLowerCase().includes('card') || error.message.toLowerCase().includes('declined')) {
        alert('💡 Usa una tarjeta de prueba válida:\n\n' +
              '• 4242 4242 4242 4242 - Pago exitoso\n' +
              '• 4000 0000 0000 3220 - Requiere 3D Secure\n' +
              '• 4000 0000 0000 9995 - Rechazado');
      }
    } finally {
      console.log('=== FIN processStripePayment ===');
    }
  }

  handleSuccessfulPayment(response: { suscripcion: any }) {
    // Actualizar usuario
    const user = this.auth.getCurrentUser();
    if (user && response.suscripcion) {
      this.auth.updateUser({
        ...user,
        estado_suscripcion: 'activa',
        suscripcion_expira_en: response.suscripcion.expira_en,
        tiene_suscripcion_activa: true,
        plan_id: this.plan.id,
        plan_nombre: this.plan.nombre,
        plan_precio: this.plan.precio
      });
    }

    // Mostrar éxito INMEDIATO en el checkout (no redirigir)
    this.showSuccessModal();
  }

  showSuccessModal() {
    // Crear modal de éxito
    const modalHtml = `
      <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0">
              <h5 class="modal-title text-success">
                <i class="bi bi-check-circle-fill me-2"></i>¡Pago Completado!
              </h5>
            </div>
            <div class="modal-body text-center py-4">
              <div class="mb-4">
                <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
              </div>
              <h4 class="mb-3">Suscripción Activada</h4>
              <p class="text-muted mb-4">
                Tu suscripción al plan <strong>${this.plan.nombre}</strong> ha sido activada correctamente.
              </p>
              <p class="text-muted">
                <small>ID de transacción: ${this.plan.id}</small>
              </p>
            </div>
            <div class="modal-footer border-0 justify-content-center">
              <button type="button" class="btn btn-primary me-2" id="goToRoutinesBtn">
                <i class="bi bi-list-check me-2"></i>Ver mis rutinas
              </button>
              <button type="button" class="btn btn-outline-primary" id="goToProfileBtn">
                <i class="bi bi-person-circle me-2"></i>Ver mi perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar modal al DOM
    const modalContainer = document.createElement('div');
    modalContainer.id = 'successModal';
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // Agregar event listeners
    setTimeout(() => {
      const goToRoutinesBtn = document.getElementById('goToRoutinesBtn');
      const goToProfileBtn = document.getElementById('goToProfileBtn');
      
      if (goToRoutinesBtn) {
        goToRoutinesBtn.addEventListener('click', () => {
          this.router.navigate(['/trainee/rutinas']);
          this.removeModal();
        });
      }
      
      if (goToProfileBtn) {
        goToProfileBtn.addEventListener('click', () => {
          this.router.navigate(['/perfil']);
          this.removeModal();
        });
      }
      
      // Cerrar modal al hacer clic fuera
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          this.removeModal();
          this.router.navigate(['/trainee/rutinas']);
        }
      });
    }, 100);
  }

  removeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      document.body.removeChild(modal);
    }
  }

  onPaymentMethodChange() {
    if (this.metodoPago === 'tarjeta' && !this.stripeInitialized) {
      this.initializeStripe();
    } else if (this.metodoPago === 'paypal') {
      this.cardError = '';
    }
  }

  cancelCheckout() {
    this.router.navigate(['/subscription/plans']);
  }

    openTermsModal(event: Event) {
    event.preventDefault();
    this.showTermsModal = true;
    // Aquí puedes implementar un modal real o redirigir a una página
    this.showModal('términos y condiciones');
  }

  openPrivacyModal(event: Event) {
    event.preventDefault();
    this.showPrivacyModal = true;
    this.showModal('política de privacidad');
  }

  showModal(tipo: string) {
    // Implementa un modal o redirige a una página de términos
    alert(`Aquí se mostrarían los ${tipo}. En una implementación real, esto sería un modal.`);
  }

  closeModals() {
    this.showTermsModal = false;
    this.showPrivacyModal = false;
  }
}