import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';
import { AdminService, Ejercicio } from '../../../../core/services/admin';


@Component({
  selector: 'app-admin-ejercicios-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './ejercicios-list.html'
})
export class AdminEjerciciosListComponent implements OnInit {
  private adminService = inject(AdminService);
  
  ejercicios: Ejercicio[] = [];
  showDeleteModal = false;
  ejercicioToDelete: Ejercicio | null = null;

  ngOnInit() {
    this.loadEjercicios();
  }

  loadEjercicios() {
    this.adminService.getEjercicios().subscribe({
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
      this.adminService.deleteEjercicio(this.ejercicioToDelete.id).subscribe({
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