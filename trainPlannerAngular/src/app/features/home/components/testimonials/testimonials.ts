import { Component } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss'
})
export class TestimonialsComponent {
  testimonials = [
    {
      id: 1,
      text: 'TrainPlanner ha revolucionado cómo gestiono a mis clientes. Ahora puedo crear rutinas personalizadas en minutos y el sistema de chat me permite estar en contacto constante con ellos.',
      author: 'Carlos Martínez',
      role: 'Entrenador Personal',
      rating: 5
    },
    {
      id: 2,
      text: 'Como alumna, poder acceder a mis rutinas desde cualquier lugar y tener recordatorios ha mejorado mi consistencia. Además, mi entrenador puede ver mi progreso y ajustar los ejercicios.',
      author: 'Ana López',
      role: 'Alumna',
      rating: 5
    },
    {
      id: 3,
      text: 'Para nuestro gimnasio, la posibilidad de tener varios entrenadores en una sola plataforma y generar reportes automáticos ha sido un cambio radical. Ahorramos horas de trabajo administrativo.',
      author: 'Miguel Ángel Ruiz',
      role: 'Dueño de Gimnasio',
      rating: 4
    }
  ];

  getInitials(name: string): string {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }
}