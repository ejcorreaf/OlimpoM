import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  dias_por_semana: number;
  duracion_dias: number;
  caracteristicas: string[];
  activo: boolean;
}

export interface Suscripcion {
  id: number;
  usuario_id: number;
  plan_id: number;
  estado: 'activa' | 'expirada' | 'cancelada' | 'pendiente';
  inicio_en: string;
  expira_en: string;
  metodo_pago: 'paypal' | 'tarjeta' | 'manual';
  transaccion_id?: string;
  datos_facturacion?: any;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface CreateSubscriptionDto {
  plan_id: number;
  metodo_pago: 'paypal' | 'tarjeta';
  datos_facturacion?: {
    nombre: string;
    email: string;
    dni?: string;
  };
}

export interface PaymentResponse {
  message: string;
  intencion_pago?: {
    intencion_pago_id?: string;
    secreto_cliente?: string;
    url_redireccion?: string;
    estado?: string;
  };
  suscripcion?: Suscripcion;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  
  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>('http://localhost:8000/api/trainee/planes');
  }
  
  
  getUserSubscription(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/api/trainee/suscripcion');
  }

  // Crear suscripción 
  createSubscription(data: CreateSubscriptionDto): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/suscripciones`, data);
  }

  // Confirmar pago
  confirmPayment(intencionPagoId: string): Observable<{ exito: boolean; message: string; suscripcion: Suscripcion }> {
    return this.http.post<{ exito: boolean; message: string; suscripcion: Suscripcion }>(
      `${this.apiUrl}/suscripciones/${intencionPagoId}/confirmar`,
      {}
    );
  }

  // Cancelar suscripción
  cancelSubscription(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/suscripciones`);
  }

  // Verificar estado de pago
  checkPaymentStatus(intencionPagoId: string): Observable<{ estado: string }> {
    return this.http.get<{ estado: string }>(
      `${this.apiUrl}/suscripciones/${intencionPagoId}/estado`
    );
  }

  // Crear orden de PayPal
  createPayPalOrder(data: CreateSubscriptionDto): Observable<{
    message: string;
    order_id: string;
    approval_url: string;
    suscripcion: Suscripcion;
  }> {
    return this.http.post<{
      message: string;
      order_id: string;
      approval_url: string;
      suscripcion: Suscripcion;
    }>(`${this.apiUrl}/paypal/create-order`, data);
  }

  // Capturar orden de PayPal
  capturePayPalOrder(orderId: string): Observable<{ exito: boolean; message: string; suscripcion: Suscripcion }> {
    return this.http.post<{ exito: boolean; message: string; suscripcion: Suscripcion }>(
      `${this.apiUrl}/paypal/capture-order/${orderId}`,
      {}
    );
  }

  // Verificar estado de orden
  checkPayPalOrderStatus(orderId: string): Observable<{ estado: string }> {
    return this.http.get<{ estado: string }>(
      `${this.apiUrl}/paypal/check-order-status/${orderId}`
    );
  }

  // Obtener clave pública de Stripe desde backend
    getStripePublicKey(): Observable<{ public_key: string; currency: string; country: string }> {
      return this.http.get<{ public_key: string; currency: string; country: string }>(
        `${this.apiUrl}/stripe/public-key`
      );
    }

    createStripePaymentIntent(data: {
      plan_id: number;
      datos_facturacion?: any;
      save_payment_method?: boolean;
    }): Observable<{
      message: string;
      payment_intent: {
        id: string;
        client_secret: string;
        amount: number;
        currency: string;
        customer: string;
      };
      suscripcion: Suscripcion;
    }> {
      return this.http.post<{
        message: string;
        payment_intent: {
          id: string;
          client_secret: string;
          amount: number;
          currency: string;
          customer: string;
        };
        suscripcion: Suscripcion;
      }>(`${this.apiUrl}/stripe/create-payment-intent`, data);
    }

    confirmStripePayment(paymentData: {
      payment_intent_id: string;
      payment_method_id: string;
    }): Observable<{ exito: boolean; message: string; suscripcion: Suscripcion }> {
      return this.http.post<{ exito: boolean; message: string; suscripcion: Suscripcion }>(
        `${this.apiUrl}/stripe/confirm-payment`,
        paymentData
      );
    }
}