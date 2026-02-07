import { Component } from '@angular/core';

@Component({
  selector: 'app-pricing-preview',
  standalone: true,
  imports: [],
  templateUrl: './pricing-preview.html',
  styleUrl: './pricing-preview.scss'
})
export class PricingPreviewComponent {
  plans = [
    {
      id: 'free',
      name: 'Básico',
      price: '9.99',
      description: 'Para quienes entrenan 2 días por semana',
      features: [
        'Acceso completo a rutinas',
        'Seguimiento de progreso',
        'Chat con entrenador',
        'Recordatorios automáticos',
      ],
      featured: false
    },
    {
      id: 'trainer',
      name: 'Avanzado',
      price: '19.99',
      description: 'Para entrenamiento intensivo 5 días por semana',
      features: [
        'Todo del plan Básico',
        'Rutinas personalizadas avanzadas',
        'Video-guías de ejercicios',
        'Análisis de técnica',
        'Prioridad en soporte',
      ],
      featured: true
    },
    {
      id: 'gym',
      name: 'Autodidacta',
      price: '14.99',
      description: 'Para entrenamiento intensivo 5 días por semana',
      features: [
        'Crea tus propias rutinas',
        'Sin dependencia de entrenador',
        'Biblioteca de ejercicios personal',
        'Reportes avanzados',
        'Estadísticas avanzadas',
        'Exporta tus rutinas'
      ],
      featured: false
    }
  ];

  selectPlan(plan: any) {
  // No permitir seleccionar el plan autodidacta
  if (plan.id === 'gym') {
    alert('Este plan estará disponible próximamente.');
    return;
  }
  
  console.log('Plan seleccionado:', plan);
  alert(`Has seleccionado el plan ${plan.name}. Esta funcionalidad se implementará en la fase de pagos.`);
}
}