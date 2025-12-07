import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, Entrenador, AsignacionRequest } from '../../../core/services/admin';
import { TraineeAsignado } from '../../../core/services/entrenador';
import { SuccessModalComponent } from '../../../shared/components/success-modal/success-modal';

@Component({
  selector: 'app-admin-asignar-trainee',
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessModalComponent],
  templateUrl: './admin-asignar-trainee.html'
})
export class AdminAsignarTraineeComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  
  @ViewChild(SuccessModalComponent) successModal!: SuccessModalComponent;
  
  entrenadores: Entrenador[] = [];
  traineesNoAsignados: TraineeAsignado[] = [];
  asignacion: AsignacionRequest = { entrenador_id: 0, trainee_id: 0 };
  loading = false;
  asignando = false;
  
  successMessage = 'Asignación creada correctamente';

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    
    // Cargar entrenadores y trainees no asignados en paralelo
    this.adminService.getEntrenadores().subscribe({
      next: (entrenadores) => {
        this.entrenadores = entrenadores;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error cargando entrenadores:', error);
        this.checkLoadingComplete();
      }
    });

    this.adminService.getTraineesNoAsignados().subscribe({
      next: (trainees) => {
        this.traineesNoAsignados = trainees;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error cargando trainees no asignados:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete() {
    // Simple check - in real app you'd want better state management
    this.loading = false;
  }

  crearAsignacion() {
    if (!this.asignacion.entrenador_id || !this.asignacion.trainee_id) {
      alert('Por favor, selecciona un entrenador y un trainee');
      return;
    }

    this.asignando = true;
    this.adminService.crearAsignacion(this.asignacion).subscribe({
      next: () => {
        this.asignando = false;
        this.successModal.show();
      },
      error: (error) => {
        this.asignando = false;
        console.error('Error creando asignación:', error);
        alert('Error al crear la asignación: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  onSuccessModalClosed() {
    this.router.navigate(['/admin/asignaciones']);
  }
}