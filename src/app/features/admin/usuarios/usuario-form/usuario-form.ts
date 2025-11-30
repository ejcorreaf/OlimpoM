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
  showPassword = false;
  passwordChanged = false;
  errorMessage: string = ''; // Para mostrar errores específicos

  roles = [
    { value: 'trainee', label: 'Trainee' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'admin', label: 'Admin' }
  ];

  constructor() {
    this.usuarioForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      dni: [''],
      password: [''],
      role: ['trainee', Validators.required],
      email_verified: [false]
    });

    this.updatePasswordValidation();
  }

  private updatePasswordValidation() {
    const passwordControl = this.usuarioForm.get('password');
    if (this.isEdit) {
      passwordControl?.clearValidators();
    } else {
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    passwordControl?.updateValueAndValidity();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.usuarioId = +params['id'];
        this.updatePasswordValidation();
        this.loadUsuario(this.usuarioId);
      }
    });

    this.usuarioForm.get('password')?.valueChanges.subscribe(value => {
      this.passwordChanged = value !== '';
    });

    // Limpiar mensajes de error cuando el usuario escribe
    this.usuarioForm.valueChanges.subscribe(() => {
      this.errorMessage = '';
    });
  }

  loadUsuario(id: number) {
  this.adminService.getUsuario(id).subscribe({
    next: (usuario) => {
      console.log('Usuario cargado:', usuario);
      
      this.usuarioForm.patchValue({
        name: usuario.name,
        email: usuario.email,
        dni: usuario.dni || '', // Asegurar que sea string vacío si es null
        role: usuario.role || 'trainee',
        email_verified: usuario.email_verified_at !== null || usuario.email_verified,
        password: ''
      });
    },
    error: (error) => {
      console.error('Error loading usuario:', error);
      this.errorMessage = 'Error al cargar el usuario';
    }
  });
}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
  this.markAllFieldsAsTouched();
  this.errorMessage = '';
  
  if (this.usuarioForm.valid) {
    this.loading = true;

    const formData = { ...this.usuarioForm.value };
    
    console.log('Datos antes de procesar:', formData);
    
    // CORREGIDO: Mejor manejo de contraseñas
    if (this.isEdit) {
      // En edición, solo enviar password si se cambió y no está vacío
      if (!this.passwordChanged || !formData.password) {
        delete formData.password;
      }
      
      // Asegurar que DNI sea null si está vacío
      if (formData.dni === '') {
        formData.dni = null;
      }
    }

    console.log('Datos después de procesar:', formData);

    const request = this.isEdit && this.usuarioId
      ? this.adminService.updateUsuario(this.usuarioId, formData)
      : this.adminService.createUsuario(formData);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/usuarios']);
      },
      error: (error) => {
        console.error('Error completo:', error);
        console.error('Error response:', error.error);
        this.loading = false;
        
        if (error.status === 422) {
          const validationErrors = error.error.errors;
          console.log('Errores de validación:', validationErrors);
          
          if (validationErrors?.email) {
            this.errorMessage = 'El email ya está en uso por otro usuario';
          } else if (validationErrors?.dni) {
            this.errorMessage = 'El DNI ya está en uso por otro usuario';
          } else if (validationErrors?.password) {
            this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
          } else {
            this.errorMessage = 'Error de validación: ' + (error.error?.message || JSON.stringify(validationErrors));
          }
        } else {
          this.errorMessage = 'Error al guardar el usuario: ' + (error.error?.message || 'Error desconocido');
        }
      }
    });
  } else {
    this.errorMessage = 'Por favor, corrige los errores del formulario';
    console.log('Formulario inválido', this.usuarioForm.errors);
  }
}

  private markAllFieldsAsTouched() {
    Object.keys(this.usuarioForm.controls).forEach(key => {
      const control = this.usuarioForm.get(key);
      control?.markAsTouched();
    });
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return control ? control.hasError(errorType) && (control.touched || false) : false;
  }
}