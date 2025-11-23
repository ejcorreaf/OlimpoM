import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.html'
})
export class AdminUsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  usuarioForm: FormGroup;
  isEdit = false;
  loading = false;
  usuarioId: number | null = null;

  roles = [
    { value: 'trainee', label: 'Trainee' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'admin', label: 'Admin' }
  ];

  constructor() {
    this.usuarioForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEdit ? Validators.nullValidator : Validators.required],
      password_confirmation: [''],
      role: ['trainee', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.usuarioId = +params['id'];
        this.loadUsuario(this.usuarioId);
      }
    });
  }

  loadUsuario(id: number) {
    this.adminService.getUsuario(id).subscribe({
      next: (usuario) => {
        this.usuarioForm.patchValue({
          name: usuario.name,
          email: usuario.email,
          role: usuario.roles?.[0] || 'trainee'
        });
        // Quitar validación de password en edición
        this.usuarioForm.get('password')?.clearValidators();
        this.usuarioForm.get('password')?.updateValueAndValidity();
      },
      error: (error) => console.error('Error loading usuario:', error)
    });
  }

  onSubmit() {
    if (this.usuarioForm.valid) {
      this.loading = true;

      const formData = this.usuarioForm.value;
      
      // Si estamos editando y no se cambió la password, eliminar el campo
      if (this.isEdit && !formData.password) {
        delete formData.password;
        delete formData.password_confirmation;
      }

      const request = this.isEdit && this.usuarioId
        ? this.adminService.updateUsuario(this.usuarioId, formData)
        : this.adminService.createUsuario(formData);

      request.subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/admin/usuarios']);
        },
        error: (error) => {
          console.error('Error saving usuario:', error);
          this.loading = false;
        }
      });
    }
  }
}