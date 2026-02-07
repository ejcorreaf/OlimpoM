import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EntrenadorService, Ejercicio } from '../../../../core/services/entrenador';

@Component({
  selector: 'app-ejercicio-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ejercicio-detail.html'
})
export class EjercicioDetailComponent implements OnInit {
  private entrenadorService = inject(EntrenadorService);
  private route = inject(ActivatedRoute);
  
  ejercicio: Ejercicio | null = null;
  loading = true;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadEjercicio(id);
    });
  }

  loadEjercicio(id: number) {
    this.entrenadorService.getEjercicio(id).subscribe({
      next: (ejercicio) => {
        this.ejercicio = ejercicio;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando ejercicio:', error);
        this.loading = false;
      }
    });
  }

  goBack() {
    window.history.back();
  }
}