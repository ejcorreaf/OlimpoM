import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, mergeMap, startWith, Subject, BehaviorSubject } from 'rxjs';
import { Mensaje, Conversacion } from './entrenador';

@Injectable({
  providedIn: 'root'
})
export class MensajesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/mensajes';
  
  // Subject para notificar nuevos mensajes
  private nuevoMensajeSubject = new Subject<Mensaje>();
  nuevoMensaje$ = this.nuevoMensajeSubject.asObservable();
  
  // Para tracking de polling activo
  private pollingActive = new BehaviorSubject<boolean>(false);

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

  // Método para polling de nuevos mensajes
  startPollingConversacion(userId: number, intervalMs: number = 3000): Observable<Mensaje[]> {
    return interval(intervalMs).pipe(
      startWith(0),
      mergeMap(() => this.getConversacion(userId))
    );
  }

  // Método para polling de conversaciones (lista)
  startPollingConversaciones(intervalMs: number = 5000): Observable<Conversacion[]> {
    return interval(intervalMs).pipe(
      startWith(0),
      mergeMap(() => this.getConversaciones())
    );
  }

  // Notificar nuevo mensaje (para usar cuando envías un mensaje)
  notifyNewMessage(mensaje: Mensaje) {
    this.nuevoMensajeSubject.next(mensaje);
  }

  // Iniciar/parar polling global
  startPolling() {
    this.pollingActive.next(true);
  }

  stopPolling() {
    this.pollingActive.next(false);
  }
}