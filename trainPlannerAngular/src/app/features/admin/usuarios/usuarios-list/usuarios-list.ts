import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';
import { AdminService, Usuario } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-usuarios-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './usuarios-list.html'
})
export class AdminUsuariosListComponent implements OnInit {
  private adminService = inject(AdminService);
  
  usuarios: Usuario[] = [];
  loading = false;
  showDeleteModal = false;
  usuarioToDelete: Usuario | null = null;

  ngOnInit() {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.loading = true;
    this.adminService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading usuarios:', error);
        this.loading = false;
      }
    });
  }

  getRol(usuario: Usuario): string {
    if (usuario.role) {
      return usuario.role;
    }
    
    if (usuario.roles && usuario.roles.length > 0) {
      const firstRole = usuario.roles[0];
      return typeof firstRole === 'string' ? firstRole : firstRole.name || 'Sin rol';
    }
    
    return 'Sin rol';
  }

  confirmDelete(usuario: Usuario) {
    this.usuarioToDelete = usuario;
    this.showDeleteModal = true;
  }

  onDeleteConfirm() {
    if (this.usuarioToDelete?.id) {
      this.adminService.deleteUsuario(this.usuarioToDelete.id).subscribe({
        next: () => {
          this.loadUsuarios();
          this.showDeleteModal = false;
          this.usuarioToDelete = null;
        },
        error: (error) => console.error('Error deleting usuario:', error)
      });
    }
  }

  onDeleteCancel() {
    this.showDeleteModal = false;
    this.usuarioToDelete = null;
  }
}