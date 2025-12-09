import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EntrenadorService, Ejercicio } from '../../../../core/services/entrenador';

@Component({
  selector: 'app-ejercicios-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ejercicios-view.html'
})
export class EjerciciosViewComponent implements OnInit {
  private entrenadorService = inject(EntrenadorService);
  
  ejercicios: Ejercicio[] = [];
  gruposMusculares: string[] = [
    'pecho', 'espalda', 'hombros', 'biceps', 
    'triceps', 'piernas', 'abdominales', 'gluteos'
  ];
  grupoSeleccionado: string = '';
  searchTerm: string = '';
  loading = true;

  ngOnInit() {
    this.loadEjercicios();
  }

  loadGruposMusculares() {
    this.entrenadorService.getGruposMusculares().subscribe({
      next: (grupos) => {
        this.gruposMusculares = grupos;
      },
      error: (error) => {
        console.error('Error cargando grupos musculares:', error);
        this.gruposMusculares = [
          'pecho', 'espalda', 'hombros', 'biceps', 
          'triceps', 'piernas', 'abdominales', 'gluteos'
        ];
      }
    });
  }

  loadEjercicios() {
    this.loading = true;
    
    this.entrenadorService.getEjercicios(
      this.grupoSeleccionado || undefined, 
      this.searchTerm || undefined
    ).subscribe({
      next: (ejercicios) => {
        this.ejercicios = ejercicios;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando ejercicios:', error);
        this.loading = false;
      }
    });
  }

  onGrupoChange(grupo: string) {
    this.grupoSeleccionado = grupo === this.grupoSeleccionado ? '' : grupo;
    this.loadEjercicios();
  }

  onSearch() {
    this.loadEjercicios();
  }

  clearFilters() {
    this.grupoSeleccionado = '';
    this.searchTerm = '';
    this.loadEjercicios();
  }
}