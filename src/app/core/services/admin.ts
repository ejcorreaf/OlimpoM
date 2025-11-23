import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: string[];
}

export interface Ejercicio {
  id: number;
  nombre: string;
  descripcion: string;
  grupo_muscular: string;
  foto: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rutina {
  id: number;
  user_id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  usuario?: Usuario;
  ejercicios?: any[];
}

export interface Trainee {
  name: string;
  email: string;
}

export interface Trainer {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/admin';

  // Usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }

  createUsuario(usuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
  }

  updateUsuario(id: number, usuario: any): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

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

  asignarEjercicios(rutinaId: number, ejercicios: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios`, { ejercicios });
  }

  sincronizarEjercicios(rutinaId: number, ejercicios: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios`, { ejercicios });
  }

  eliminarEjercicioRutina(rutinaId: number, ejercicioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rutinas/${rutinaId}/ejercicios/${ejercicioId}`);
  }

  // Trainees y Trainers
  getTrainees(): Observable<Trainee[]> {
    return this.http.get<Trainee[]>(`${this.apiUrl}/trainees`);
  }

  getTrainers(): Observable<Trainer[]> {
    return this.http.get<Trainer[]>(`${this.apiUrl}/trainers`);
  }
}