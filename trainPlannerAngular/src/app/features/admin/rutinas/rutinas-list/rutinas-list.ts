import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';
import { AdminService, Rutina } from '../../../../core/services/admin';


@Component({
  selector: 'app-admin-rutinas-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './rutinas-list.html'
})
export class AdminRutinasListComponent implements OnInit {
  private adminService = inject(AdminService);
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
    this.adminService.getRutinas(search).subscribe({
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
      this.adminService.deleteRutina(this.rutinaToDelete.id).subscribe({
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