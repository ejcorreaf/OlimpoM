import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EntrenadorService, TraineeAsignado } from '../../../../core/services/entrenador';

@Component({
  selector: 'app-trainees-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trainees-list.html',
})
export class TraineesListComponent implements OnInit {
  private entrenadorService = inject(EntrenadorService);
  
  trainees: TraineeAsignado[] = [];
  loading = false;

  ngOnInit() {
    this.cargarTrainees();
  }

  cargarTrainees() {
  this.loading = true;
  this.entrenadorService.getTrainees().subscribe({
    next: (trainees) => {
      this.trainees = trainees;
      this.loading = false;
    },
    error: (error) => {
      console.error('Error cargando trainees:', error);
      this.loading = false;
    }
  });
}
}