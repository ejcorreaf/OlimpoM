import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje, Conversacion } from './entrenador';

@Injectable({
  providedIn: 'root'
})
export class MensajesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/mensajes';

  getConversaciones(): Observable<Conversacion[]> {
    return this.http.get<Conversacion[]>(`${this.apiUrl}/conversaciones`);
  }

  getConversacion(userId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/conversacion/${userId}`);
  }

  enviarMensaje(receptorId: number, mensaje: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.apiUrl}/enviar`, {
      receptor_id: receptorId,
      mensaje: mensaje
    });
  }
}