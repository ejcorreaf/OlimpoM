import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';
import { Ejercicio, EjercicioRutina, EntrenadorService } from '../../../../core/services/entrenador';


@Component({
  selector: 'app-asignar-ejercicios',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './asignar-ejercicios.html'
})
export class AsignarEjerciciosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private entrenadorService = inject(EntrenadorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ejerciciosForm: FormGroup;
  ejerciciosDisponibles: Ejercicio[] = [];
  ejerciciosAsignados: any[] = [];
  rutinaId: number = 0;
  rutina: any = null;
  loading = false;
  showDeleteModal = false;
  ejercicioToDelete: any = null;

  constructor() {
    this.ejerciciosForm = this.fb.group({
      ejercicios: this.fb.array([])
    });
  }

  get ejerciciosArray(): FormArray {
    return this.ejerciciosForm.get('ejercicios') as FormArray;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.rutinaId = +params['id'];
      this.loadRutina();
      this.loadEjerciciosDisponibles();
      this.loadEjerciciosAsignados();
    });
  }

  loadRutina() {
    this.entrenadorService.getRutina(this.rutinaId).subscribe({
      next: (rutina) => this.rutina = rutina,
      error: (error) => console.error('Error loading rutina:', error)
    });
  }

  loadEjerciciosDisponibles() {
    this.entrenadorService.getEjercicios().subscribe({
      next: (ejercicios) => this.ejerciciosDisponibles = ejercicios,
      error: (error) => console.error('Error loading ejercicios:', error)
    });
  }

  loadEjerciciosAsignados() {
    this.entrenadorService.getEjerciciosRutina(this.rutinaId).subscribe({
      next: (ejercicios) => {
        this.ejerciciosAsignados = ejercicios;
        this.rebuildForm();
      },
      error: (error) => console.error('Error loading ejercicios asignados:', error)
    });
  }

  rebuildForm() {
    this.ejerciciosArray.clear();
    
    this.ejerciciosAsignados.forEach(ejercicio => {
      this.ejerciciosArray.push(this.fb.group({
        id: [ejercicio.id, Validators.required],
        series: [ejercicio.pivot?.series || 3, [Validators.required, Validators.min(1)]],
        repeticiones: [ejercicio.pivot?.repeticiones || 10, [Validators.required, Validators.min(1)]],
        descanso: [ejercicio.pivot?.descanso || 60, [Validators.required, Validators.min(0)]]
      }));
    });
  }

  agregarEjercicio() {
    this.ejerciciosArray.push(this.fb.group({
      id: ['', Validators.required],
      series: [3, [Validators.required, Validators.min(1)]],
      repeticiones: [10, [Validators.required, Validators.min(1)]],
      descanso: [60, [Validators.required, Validators.min(0)]]
    }));
  }

  eliminarEjercicio(index: number) {
    this.ejerciciosArray.removeAt(index);
  }

  confirmEliminarEjercicio(ejercicio: any) {
    this.ejercicioToDelete = ejercicio;
    this.showDeleteModal = true;
  }

  onEliminarConfirm() {
    if (this.ejercicioToDelete) {
      this.entrenadorService.eliminarEjercicioRutina(this.rutinaId, this.ejercicioToDelete.id).subscribe({
        next: () => {
          this.loadEjerciciosAsignados();
          this.showDeleteModal = false;
          this.ejercicioToDelete = null;
        },
        error: (error) => console.error('Error deleting ejercicio:', error)
      });
    }
  }

  onEliminarCancel() {
    this.showDeleteModal = false;
    this.ejercicioToDelete = null;
  }

  onSubmit() {
    if (this.ejerciciosForm.valid) {
      this.loading = true;
      
      const ejerciciosData: EjercicioRutina[] = this.ejerciciosArray.value;

      this.entrenadorService.sincronizarEjercicios(this.rutinaId, ejerciciosData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/entrenador/rutinas']);
        },
        error: (error) => {
          console.error('Error saving ejercicios:', error);
          this.loading = false;
        }
      });
    }
  }
}