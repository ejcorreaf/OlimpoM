import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, Entrenador } from '../../../core/services/admin';

@Component({
  selector: 'app-admin-asignaciones-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-asignaciones.html'
})
export class AdminAsignacionesListComponent implements OnInit {
  private adminService = inject(AdminService);
  
  entrenadores: Entrenador[] = [];
  loading = false;

  ngOnInit() {
    this.cargarAsignaciones();
  }

  cargarAsignaciones() {
    this.loading = true;
    this.adminService.getAsignaciones().subscribe({
      next: (entrenadores) => {
        this.entrenadores = entrenadores;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando asignaciones:', error);
        this.loading = false;
      }
    });
  }

  desasignarTrainee(entrenadorId: number, traineeId: number) {
    if (confirm('¿Estás seguro de que quieres desasignar este trainee?')) {
      this.adminService.eliminarAsignacion(entrenadorId, traineeId).subscribe({
        next: () => {
          this.cargarAsignaciones();
        },
        error: (error) => {
          console.error('Error desasignando trainee:', error);
          alert('Error al desasignar el trainee');
        }
      });
    }
  }
}