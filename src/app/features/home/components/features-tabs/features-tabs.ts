import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-features-tabs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './features-tabs.html',
  styleUrls: ['./features-tabs.scss']
})
export class FeaturesTabsComponent {
  activeTab: string = 'trainer';

  tabs = [
    {
      id: 'trainer',
      title: 'Para Entrenadores',
      icon: 'bi bi-person-badge',
      mainTitle: 'Potencia tu trabajo como entrenador',
      description: 'Gestiona a todos tus alumnos desde una sola plataforma. Crea rutinas personalizadas, sigue su progreso y comunícate en tiempo real.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop',
      imageCaption: 'Crea rutinas personalizadas para cada alumno',
      ctaText: 'Registrarse',
      ctaLink: '/register',
      features: [
        {
          title: 'Creación Ilimitada de Rutinas',
          description: 'Diseña rutinas personalizadas para cada alumno con ejercicios específicos y series/repes detalladas.'
        },
        {
          title: 'Gestión de Múltiples Alumnos',
          description: 'Organiza y supervisa a todos tus alumnos desde un solo panel centralizado.'
        },
        {
          title: 'Sistema de Chat Integrado',
          description: 'Comunicación directa y en tiempo real con cada alumno para resolver dudas al instante.'
        },
        {
          title: 'Estadísticas de Progreso',
          description: 'Visualiza el progreso de tus alumnos con gráficos detallados y métricas avanzadas.'
        },
        {
          title: 'Exportación de Datos',
          description: 'Exporta informes, rutinas y estadísticas en formatos PDF, Excel o CSV.'
        },
        {
          title: 'Recordatorios Automáticos',
          description: 'Programa recordatorios automáticos para entrenamientos, sesiones y pagos.'
        }
      ]
    },
    {
      id: 'trainee',
      title: 'Para Alumnos',
      icon: 'bi bi-person',
      mainTitle: 'Alcanza tus objetivos fitness',
      description: 'Sigue tus rutinas desde cualquier dispositivo, registra tu progreso y mantén contacto directo con tu entrenador.',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop',
      imageCaption: 'Accede a tus rutinas desde cualquier lugar',
      features: [
        {
          title: 'Acceso a Rutinas Personalizadas',
          description: 'Recibe rutinas adaptadas específicamente a tus objetivos, nivel y disponibilidad.'
        },
        {
          title: 'Historial de Entrenamientos',
          description: 'Consulta tu historial completo de entrenamientos con pesos, repeticiones y notas.'
        },
        {
          title: 'Notificaciones Inteligentes',
          description: 'Recibe recordatorios antes de cada entrenamiento y notificaciones de nuevos ejercicios.'
        },
        {
          title: 'Seguimiento de Progreso',
          description: 'Visualiza tu progreso con gráficos de evolución de pesos, medidas y marcas personales.'
        },
        {
          title: 'Comunicación Directa',
          description: 'Chatea con tu entrenador para resolver dudas, ajustar rutinas o compartir logros.'
        },
        {
          title: 'Ejercicios con Video',
          description: 'Accede a videos demostrativos de cada ejercicio para asegurar la técnica correcta.'
        }
      ]
    },
    {
      id: 'gym',
      title: 'Para Gimnasios',
      icon: 'bi bi-building',
      mainTitle: 'Digitaliza tu gimnasio',
      description: 'Gestiona múltiples entrenadores, clientes y operaciones desde una plataforma centralizada con branding personalizado.',
      image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&auto=format&fit=crop',
      imageCaption: 'Gestiona todo tu equipo desde una sola plataforma',
      features: [
        {
          title: 'Multi-usuario Avanzado',
          description: 'Gestiona múltiples entrenadores, administradores y recepcionistas desde una sola cuenta.'
        },
        {
          title: 'Dashboard Administrativo',
          description: 'Panel completo con métricas de negocio, asistencia, ingresos y satisfacción de clientes.'
        },
        {
          title: 'Control de Membresías',
          description: 'Administra suscripciones, pagos, renovaciones y accesos de todos los clientes.'
        },
        {
          title: 'Reportes Financieros',
          description: 'Genera reportes detallados de ingresos, gastos, rentabilidad y proyecciones.'
        },
        {
          title: 'Branding Personalizado',
          description: 'Personaliza la app con el logo, colores y nombre de tu gimnasio para tus clientes.'
        },
        {
          title: 'Soporte Prioritario',
          description: 'Recibe soporte técnico prioritario, migración asistida y capacitación para tu equipo.'
        }
      ]
    }
  ];

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }
}