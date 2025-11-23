import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RutinaTrainee {
  id: number;
  nombre: string;
  descripcion: string;
  user_id: number;
  ejercicios: EjercicioRutina[];
  created_at?: string;
  updated_at?: string;
}

export interface EjercicioRutina {
  id: number;
  nombre: string;
  descripcion: string;
  grupo_muscular: string;
  foto: string | null;
  pivot: {
    rutina_id: number;
    ejercicio_id: number;
    series: number;
    repeticiones: number;
    descanso: number;
    created_at?: string;
    updated_at?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TraineeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/trainee';

  getRutinas(): Observable<RutinaTrainee[]> {
    return this.http.get<RutinaTrainee[]>(`${this.apiUrl}/rutinas`);
  }

  getRutina(id: number): Observable<RutinaTrainee> {
    return this.http.get<RutinaTrainee>(`${this.apiUrl}/rutinas/${id}`);
  }
}