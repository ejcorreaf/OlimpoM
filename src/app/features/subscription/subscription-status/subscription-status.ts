import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-subscription-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './subscription-status.html',
  styleUrls: ['./subscription-status.scss']
})
export class SubscriptionStatusComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  
  suscripcion: any = null;
  loading = true;
  tieneSuscripcionActiva = false;
  isTrainee = false;

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    this.isTrainee = user?.role === 'trainee';
    
    if (this.isTrainee) {
      this.loadSubscription();
    } else {
      this.loading = false;
    }
  }

  loadSubscription() {
    this.loading = true;
    this.subscriptionService.getUserSubscription().subscribe({
      next: (response) => {
        this.suscripcion = response.suscripcion;
        this.tieneSuscripcionActiva = response.tiene_activa;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando suscripción:', error);
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Activa',
      'expired': 'Expirada',
      'pending': 'Pendiente',
      'cancelled': 'Cancelada',
      'none': 'Sin suscripción'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'activa': 'badge bg-success', //Lo cambié a español para que los estilos funcionen
      'expirada': 'badge bg-warning',
      'pendiente': 'badge bg-info',
      'cancelada': 'badge bg-secondary',
      'sin suscripcion': 'badge bg-light text-dark'
    };
    return classes[status] || 'badge bg-light';
  }

  cancelSubscription() {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción? Perderás acceso a las rutinas.')) {
      return;
    }

    this.subscriptionService.cancelSubscription().subscribe({
      next: () => {
        alert('Suscripción cancelada correctamente');
        this.loadSubscription();
      },
      error: (error) => {
        console.error('Error cancelling subscription:', error);
        alert('Error al cancelar la suscripción');
      }
    });
  }
}