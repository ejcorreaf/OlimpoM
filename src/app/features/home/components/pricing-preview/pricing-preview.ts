// src/app/features/home/components/pricing-preview/pricing-preview.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricing-preview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing-preview.html',
  styleUrl: './pricing-preview.scss'
})
export class PricingPreviewComponent {
  plans = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      description: 'Perfecto para alumnos que quieren comenzar',
      features: [
        'Acceso como alumno',
        '1 rutina activa',
        'Chat con entrenador',
        'Recordatorios básicos',
        'App móvil incluida'
      ],
      featured: false
    },
    {
      id: 'trainer',
      name: 'Trainer',
      price: '9.99',
      description: 'Para entrenadores independientes',
      features: [
        'Hasta 10 alumnos',
        'Rutinas ilimitadas',
        'Estadísticas avanzadas',
        'Chat grupal',
        'Soporte prioritario',
        'Exportación PDF/Excel'
      ],
      featured: true
    },
    {
      id: 'gym',
      name: 'Gym',
      price: '29.99',
      description: 'Para gimnasios y equipos',
      features: [
        'Usuarios ilimitados',
        'Branding personalizado',
        'API de integración',
        'Reportes avanzados',
        'Soporte 24/7',
        'Backup automático',
        'Migración asistida'
      ],
      featured: false
    }
  ];

  selectPlan(plan: any) {
    console.log('Plan seleccionado:', plan);
    alert(`Has seleccionado el plan ${plan.name}. Esta funcionalidad se implementará en la fase de pagos.`);
  }
}