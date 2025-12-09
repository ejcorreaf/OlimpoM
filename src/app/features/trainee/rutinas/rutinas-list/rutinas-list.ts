import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TraineeService, RutinaTrainee } from '../../../../core/services/trainee';

@Component({
  selector: 'app-trainee-rutinas-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rutinas-list.html'
})
export class TraineeRutinasListComponent implements OnInit {
  private traineeService = inject(TraineeService);
  
  rutinas: RutinaTrainee[] = [];
  loading = false;

  ngOnInit() {
    this.loadRutinas();
  }

  loadRutinas() {
    this.loading = true;
    this.traineeService.getRutinas().subscribe({
      next: (rutinas) => {
        console.log('Rutinas recibidas:', rutinas);
        this.rutinas = rutinas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rutinas:', error);
        this.loading = false;
      }
    });
  }

  contarEjercicios(rutina: RutinaTrainee): number {
    return rutina.ejercicios?.length || 0;
  }
}