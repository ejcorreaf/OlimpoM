import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-ejercicio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './ejercicios-form.html'
})
export class AdminEjercicioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ejercicioForm: FormGroup;
  isEdit = false;
  loading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  currentFoto: string | null = null;
  ejercicioId: number | null = null;

  gruposMusculares = [
    'pectorales', 'espalda', 'hombros', 'biceps', 
    'triceps', 'piernas', 'abdominales', 'gluteos'
  ];

  constructor() {
    this.ejercicioForm = this.fb.group({
      nombre: ['', Validators.required],
      grupo_muscular: ['', Validators.required],
      descripcion: [''],
      foto: [null]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.ejercicioId = +params['id'];
        this.loadEjercicio(this.ejercicioId);
      }
    });
  }

  loadEjercicio(id: number) {
    this.adminService.getEjercicio(id).subscribe({
      next: (ejercicio) => {
        this.ejercicioForm.patchValue(ejercicio);
        this.currentFoto = ejercicio.foto || null;
      },
      error: (error) => console.error('Error loading ejercicio:', error)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
  if (this.ejercicioForm.valid) {
    this.loading = true;
    
    const formData = new FormData();
    
    // Para edición, necesitas enviar todos los campos, no solo los modificados
    formData.append('nombre', this.ejercicioForm.get('nombre')?.value);
    formData.append('grupo_muscular', this.ejercicioForm.get('grupo_muscular')?.value);
    formData.append('descripcion', this.ejercicioForm.get('descripcion')?.value);
    
    // Importante: Para Laravel, cuando usas FormData en actualizaciones
    formData.append('_method', 'PUT'); // Esto es clave para Laravel
    
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    }

    const request = this.isEdit && this.ejercicioId
      ? this.adminService.updateEjercicio(this.ejercicioId, formData)
      : this.adminService.createEjercicio(formData);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/ejercicios']);
      },
      error: (error) => {
        console.error('Error saving ejercicio:', error);
        this.loading = false;
        // Agrega manejo de errores más específico
        if (error.error) {
          console.error('Error details:', error.error);
        }
      }
    });
    }
  }
}