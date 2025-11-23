import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RutinaTrainee, TraineeService } from '../../../../core/services/trainee';

@Component({
  selector: 'app-trainee-rutina-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rutina-detalle.html'
})
export class TraineeRutinaDetalleComponent implements OnInit {
  private traineeService = inject(TraineeService);
  private route = inject(ActivatedRoute);
  
  rutina: RutinaTrainee | null = null;
  loading = false;
  gruposMusculares: { [key: string]: any[] } = {};

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadRutina(id);
    });
  }

  loadRutina(id: number) {
    this.loading = true;
    this.traineeService.getRutina(id).subscribe({
      next: (rutina) => {
        console.log('Rutina detalle recibida:', rutina); // Para debug
        this.rutina = rutina;
        this.gruposMusculares = this.agruparPorGrupoMuscular();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rutina:', error);
        this.loading = false;
      }
    });
  }

  agruparPorGrupoMuscular(): { [key: string]: any[] } {
    if (!this.rutina?.ejercicios || this.rutina.ejercicios.length === 0) return {};
    
    return this.rutina.ejercicios.reduce((grupos, ejercicio) => {
      const grupo = ejercicio.grupo_muscular || 'general';
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(ejercicio);
      return grupos;
    }, {} as { [key: string]: any[] });
  }

  contarGruposMusculares(): number {
    return Object.keys(this.gruposMusculares).length;
  }

  calcularTotalSeries(): number {
    if (!this.rutina?.ejercicios) return 0;
    
    return this.rutina.ejercicios.reduce((total, ejercicio) => {
      return total + (ejercicio.pivot?.series || 0);
    }, 0);
  }

  calcularTiempoEstimado(): number {
    if (!this.rutina?.ejercicios) return 0;
    
    const tiempoPorEjercicio = 3; // minutos por ejercicio (series + descanso)
    const tiempoExtra = 10; // minutos extra para calentamiento/estiramientos
    
    return Math.round(this.rutina.ejercicios.length * tiempoPorEjercicio + tiempoExtra);
  }

  tieneEjercicios(): boolean {
    return !!(this.rutina?.ejercicios && this.rutina.ejercicios.length > 0);
  }

  getFotoEjercicio(ejercicio: any): string {
    if (ejercicio.foto) {
      return `http://localhost:8000/ejercicios/${ejercicio.foto}`;
    }
    return 'assets/images/placeholder-exercise.jpg'; // Imagen por defecto
  }
}