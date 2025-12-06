import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { Mensaje } from '../../../core/services/entrenador';
import { AuthService } from '../../../core/services/auth';
import { Subscription, interval, mergeMap, startWith } from 'rxjs';

@Component({
  selector: 'app-trainee-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class TraineeChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  private mensajesService = inject(MensajesService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  mensajes: Mensaje[] = [];
  miEntrenador: any = null;
  miUsuarioId: number = 0;
  nuevoMensaje = '';
  cargandoMensajes = false;
  enviando = false;
  
  // Variables para polling
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000; // 3 segundos

  ngOnInit() {
    // Obtener usuario actual y su entrenador
    this.authService.user$.subscribe(user => {
      if (user) {
        this.miUsuarioId = user.id;
        this.miEntrenador = user.entrenador_asignado;
        
        // Si tiene entrenador, cargar mensajes y empezar polling
        if (this.miEntrenador) {
          this.cargarMensajes();
          this.startPolling();
        }
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    // Limpiar suscripciones al destruir componente
    this.stopPolling();
  }

  cargarMensajes() {
    if (!this.miEntrenador) return;
    
    this.cargandoMensajes = true;
    this.mensajesService.getConversacion(this.miEntrenador.id).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        this.cargandoMensajes = false;
      },
      error: (error) => {
        console.error('Error cargando mensajes:', error);
        this.cargandoMensajes = false;
      }
    });
  }

  // Iniciar polling para mensajes
  startPolling() {
    if (!this.miEntrenador) return;
    
    this.stopPolling();
    
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        mergeMap(() => this.mensajesService.getConversacion(this.miEntrenador.id))
      )
      .subscribe({
        next: (mensajes) => {
          // Solo actualizar si hay nuevos mensajes
          if (this.hasNewMessages(mensajes)) {
            this.mensajes = mensajes;
          }
        },
        error: (error) => {
          console.error('Error en polling de mensajes:', error);
        }
      });
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // Verificar si hay nuevos mensajes
  private hasNewMessages(newMensajes: Mensaje[]): boolean {
    if (this.mensajes.length !== newMensajes.length) return true;
    
    // Comparar el último mensaje
    if (this.mensajes.length > 0 && newMensajes.length > 0) {
      return this.mensajes[this.mensajes.length - 1].id !== 
             newMensajes[newMensajes.length - 1].id;
    }
    
    return false;
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.miEntrenador) return;

    this.enviando = true;
    this.mensajesService.enviarMensaje(this.miEntrenador.id, this.nuevoMensaje).subscribe({
      next: (mensaje) => {
        // Añadir el mensaje localmente inmediatamente
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.enviando = false;
        
        // Hacer scroll al final
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error enviando mensaje:', error);
        this.enviando = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer?.nativeElement) {
        setTimeout(() => {
          this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
        }, 100);
      }
    } catch(err) { }
  }
}