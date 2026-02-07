import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';
import { EntrenadorService, Rutina } from '../../../../core/services/entrenador';


@Component({
  selector: 'app-rutinas-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './rutinas-list.html'
})
export class RutinasListComponent implements OnInit {
  private entrenadorService = inject(EntrenadorService);
  private fb = inject(FormBuilder);
  
  rutinas: any[] = [];
  searchForm: FormGroup;
  showDeleteModal = false;
  rutinaToDelete: Rutina | null = null;
  loading = false;

  constructor() {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit() {
    this.loadRutinas();
    
    this.searchForm.get('search')?.valueChanges.subscribe(search => {
      this.loadRutinas(search);
    });
  }

  loadRutinas(search: string = '') {
    this.loading = true;
    this.entrenadorService.getRutinas(search).subscribe({
      next: (response) => {
        this.rutinas = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rutinas:', error);
        this.loading = false;
      }
    });
  }

  confirmDelete(rutina: Rutina) {
    this.rutinaToDelete = rutina;
    this.showDeleteModal = true;
  }

  onDeleteConfirm() {
    if (this.rutinaToDelete?.id) {
      this.entrenadorService.deleteRutina(this.rutinaToDelete.id).subscribe({
        next: () => {
          this.loadRutinas();
          this.showDeleteModal = false;
          this.rutinaToDelete = null;
        },
        error: (error) => console.error('Error deleting rutina:', error)
      });
    }
  }

  onDeleteCancel() {
    this.showDeleteModal = false;
    this.rutinaToDelete = null;
  }
}