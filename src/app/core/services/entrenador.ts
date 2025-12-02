import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ejercicio {
  id?: number;
  nombre: string;
  descripcion: string;
  grupo_muscular: string;
  foto?: string;
}

export interface Rutina {
  id?: number;
  user_id: number;
  nombre: string;
  descripcion?: string;
  usuario?: any;
  ejercicios?: any[];
}

export interface TraineeAsignado {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
}

export interface EjercicioRutina {
  id: number;
  series: number;
  repeticiones: number;
  descanso: number;
}

export interface Mensaje {
  id: number;
  emisor_id: number;
  receptor_id: number;
  mensaje: string;
  leido: boolean;
  created_at: string;
  emisor?: { id: number; name: string; photo_url: string };
  receptor?: { id: number; name: string; photo_url: string };
}

export interface Conversacion {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  ultimo_mensaje?: Mensaje;
  sin_leer: number;
}

@Injectable({
  providedIn: 'root'
})
export class EntrenadorService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/entrenador';

  // Ejercicios
  getEjercicios(): Observable<Ejercicio[]> {
    return this.http.get<Ejercicio[]>(`${this.apiUrl}/ejercicios`);
  }

  getEjercicio(id: number): Observable<Ejercicio> {
    return this.http.get<Ejercicio>(`${this.apiUrl}/ejercicios/${id}`);
  }

  createEjercicio(ejercicio: FormData): Observable<Ejercicio> {
    return this.http.post<Ejercicio>(`${this.apiUrl}/ejercicios`, ejercicio);
  }

  updateEjercicio(id: number, ejercicio: FormData): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(`${this.apiUrl}/ejercicios/${id}`, ejercicio);
  }

  deleteEjercicio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ejercicios/${id}`);
  }

  // Rutinas
  getRutinas(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any>(`${this.apiUrl}/rutinas`, { params });
  }

  getRutina(id: number): Observable<Rutina> {
    return this.http.get<Rutina>(`${this.apiUrl}/rutinas/${id}`);
  }

  createRutina(rutina: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rutinas`, rutina);
  }

  updateRutina(id: number, rutina: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rutinas/${id}`, rutina);
  }

  deleteRutina(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rutinas/${id}`);
  }

  // Ejercicios de Rutinas
  getEjerciciosRutina(rutinaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios`);
  }

  asignarEjercicios(rutinaId: number, ejercicios: EjercicioRutina[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios`, { ejercicios });
  }

  sincronizarEjercicios(rutinaId: number, ejercicios: EjercicioRutina[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios`, { ejercicios });
  }

  eliminarEjercicioRutina(rutinaId: number, ejercicioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios/${ejercicioId}`);
  }

  // SOLO UN MÉTODO PARA TRAINEES
  getTrainees(): Observable<TraineeAsignado[]> {
    return this.http.get<TraineeAsignado[]>(`${this.apiUrl}/trainees`);
  }

  // ELIMINADO: getMisTrainees() - Usa getTrainees() para todo
}