import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, Entrenador } from '../../../core/services/admin';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';
import { SuccessModalComponent } from '../../../shared/components/success-modal/success-modal';

@Component({
  selector: 'app-admin-asignaciones-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmModalComponent, SuccessModalComponent],
  templateUrl: './admin-asignaciones.html'
})
export class AdminAsignacionesListComponent implements OnInit {
  private adminService = inject(AdminService);
  
  @ViewChild(SuccessModalComponent) successModal!: SuccessModalComponent;
  
  entrenadores: Entrenador[] = [];
  loading = false;
  
  showConfirmModal = false;
  confirmMessage = '¿Estás seguro de que quieres desasignar este trainee?';
  successMessage = 'Trainee desasignado correctamente';
  
  selectedEntrenadorId = 0;
  selectedTraineeId = 0;

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

  prepareDesasignarTrainee(entrenadorId: number, traineeId: number) {
    this.selectedEntrenadorId = entrenadorId;
    this.selectedTraineeId = traineeId;
    this.showConfirmModal = true;
  }

  desasignarTrainee() {
    this.showConfirmModal = false;
    this.adminService.eliminarAsignacion(this.selectedEntrenadorId, this.selectedTraineeId).subscribe({
      next: () => {
        this.actualizarDatosLocalmente();
        this.successModal.show();
      },
      error: (error) => {
        console.error('Error desasignando trainee:', error);
        alert('Error al desasignar el trainee');
      }
    });
  }

  actualizarDatosLocalmente() {
    const entrenadorIndex = this.entrenadores.findIndex(e => e.id === this.selectedEntrenadorId);
    if (entrenadorIndex !== -1) {
      const entrenador = this.entrenadores[entrenadorIndex];
      if (entrenador.trainees_asignados) {
        const traineeIndex = entrenador.trainees_asignados.findIndex(t => t.id === this.selectedTraineeId);
        if (traineeIndex !== -1) {
          entrenador.trainees_asignados.splice(traineeIndex, 1);
          
          if (entrenador.trainees_asignados.length === 0) {
            this.entrenadores.splice(entrenadorIndex, 1);
          }
        }
      }
    }
  }

  onConfirmModalCancel() {
    this.showConfirmModal = false;
    this.selectedEntrenadorId = 0;
    this.selectedTraineeId = 0;
  }
}