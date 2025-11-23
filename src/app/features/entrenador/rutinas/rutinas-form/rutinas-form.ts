import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EntrenadorService, Trainee } from '../../../../core/services/entrenador';


@Component({
  selector: 'app-rutina-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rutinas-form.html'
})
export class RutinaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private entrenadorService = inject(EntrenadorService);
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
    this.entrenadorService.getTrainees().subscribe({
      next: (trainees) => this.trainees = trainees,
      error: (error) => console.error('Error loading trainees:', error)
    });
  }

  loadRutina(id: number) {
    this.entrenadorService.getRutina(id).subscribe({
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
        ? this.entrenadorService.updateRutina(this.rutinaId, rutinaData)
        : this.entrenadorService.createRutina(rutinaData);

      request.subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/entrenador/rutinas']);
        },
        error: (error) => {
          console.error('Error saving rutina:', error);
          this.loading = false;
        }
      });
    }
  }
}