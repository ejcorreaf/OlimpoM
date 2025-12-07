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
    
    // Añadir datos al FormData
    formData.append('nombre', this.ejercicioForm.get('nombre')?.value);
    formData.append('grupo_muscular', this.ejercicioForm.get('grupo_muscular')?.value);
    formData.append('descripcion', this.ejercicioForm.get('descripcion')?.value || '');
    
    // SOLO añadir la foto si se seleccionó una nueva
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    } else if (this.isEdit) {
      // Si estamos editando y no se cambió la foto, enviar 'currentFoto' para indicar que debe mantenerse
      formData.append('currentFoto', this.currentFoto || '');
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
        
        // Manejo de errores más detallado
        if (error.status === 422) {
          console.error('Errores de validación:', error.error.errors);
        }
      }
    });
  }
}
}