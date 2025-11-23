import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EntrenadorService, Ejercicio } from '../../../../core/services/entrenador';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';


@Component({
  selector: 'app-ejercicios-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './ejercicios-list.html'
})

export class EjerciciosListComponent implements OnInit {
  private entrenadorService = inject(EntrenadorService);
  
  ejercicios: Ejercicio[] = [];
  showDeleteModal = false;
  ejercicioToDelete: Ejercicio | null = null;

  ngOnInit() {
    this.loadEjercicios();
  }

  loadEjercicios() {
    this.entrenadorService.getEjercicios().subscribe({
      next: (ejercicios) => this.ejercicios = ejercicios,
      error: (error) => console.error('Error loading ejercicios:', error)
    });
  }

  confirmDelete(ejercicio: Ejercicio) {
    this.ejercicioToDelete = ejercicio;
    this.showDeleteModal = true;
  }

  onDeleteConfirm() {
    if (this.ejercicioToDelete?.id) {
      this.entrenadorService.deleteEjercicio(this.ejercicioToDelete.id).subscribe({
        next: () => {
          this.loadEjercicios();
          this.showDeleteModal = false;
          this.ejercicioToDelete = null;
        },
        error: (error) => console.error('Error deleting ejercicio:', error)
      });
    }
  }

  onDeleteCancel() {
    this.showDeleteModal = false;
    this.ejercicioToDelete = null;
  }
}