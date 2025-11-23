import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService, Trainee } from '../../../../core/services/admin';

@Component({
  selector: 'app-admin-rutina-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rutina-form.html'
})
export class AdminRutinaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  rutinaForm: FormGroup;
  isEdit = false;
  loading = false;
  trainees: Trainee[] = [];
  rutinaId: number | null = null;

  constructor() {
    this.rutinaForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit() {
    this.loadTrainees();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.rutinaId = +params['id'];
        this.loadRutina(this.rutinaId);
      }
    });
  }

  loadTrainees() {
    this.adminService.getTrainees().subscribe({
      next: (trainees) => this.trainees = trainees,
      error: (error) => console.error('Error loading trainees:', error)
    });
  }

  loadRutina(id: number) {
    this.adminService.getRutina(id).subscribe({
      next: (rutina) => {
        this.rutinaForm.patchValue({
          email: rutina.usuario?.email || '',
          nombre: rutina.nombre,
          descripcion: rutina.descripcion
        });
      },
      error: (error) => console.error('Error loading rutina:', error)
    });
  }

  onSubmit() {
    if (this.rutinaForm.valid) {
      this.loading = true;

      const rutinaData = this.rutinaForm.value;

      const request = this.isEdit && this.rutinaId
        ? this.adminService.updateRutina(this.rutinaId, rutinaData)
        : this.adminService.createRutina(rutinaData);

      request.subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/admin/rutinas']);
        },
        error: (error) => {
          console.error('Error saving rutina:', error);
          this.loading = false;
        }
      });
    }
  }
}