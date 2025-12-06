import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { EntrenadorService, Mensaje, TraineeAsignado } from '../../../core/services/entrenador';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  private mensajesService = inject(MensajesService);
  private entrenadorService = inject(EntrenadorService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  conversaciones: any[] = [];
  mensajes: Mensaje[] = [];
  usuarioSeleccionado: any = null;
  usuarioSeleccionadoId: number | null = null;
  miUsuarioId: number = 0;
  nuevoMensaje = '';
  cargandoMensajes = false;
  enviando = false;
  
  // Nuevas variables para iniciar chat
  mostrarModalNuevoChat = false;
  traineeSeleccionadoId: number | null = null;
  misTrainees: TraineeAsignado[] = [];
  
  // Variables para polling
  private pollingSubscription?: Subscription;
  private conversacionesPollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000; // 3 segundos
  private readonly CONVERSACIONES_POLLING_INTERVAL = 5000; // 5 segundos

  ngOnInit() {
    // Obtener el ID del usuario actual
    this.authService.user$.subscribe(user => {
      if (user) {
        this.miUsuarioId = user.id;
      }
    });
    
    this.cargarConversaciones();
    this.cargarMisTrainees();
    
    // Iniciar polling de conversaciones
    this.startConversacionesPolling();
    
    // Verificar si hay un ID en la ruta
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.seleccionarConversacionPorId(parseInt(params['id']));
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    // Limpiar suscripciones al destruir componente
    this.stopPolling();
    this.stopConversacionesPolling();
  }

  cargarConversaciones() {
    this.mensajesService.getConversaciones().subscribe({
      next: (conversaciones) => {
        this.conversaciones = conversaciones;
      },
      error: (error) => {
        console.error('Error cargando conversaciones:', error);
      }
    });
  }

  // Iniciar polling para conversaciones (lista)
  startConversacionesPolling() {
    this.stopConversacionesPolling();
    
    this.conversacionesPollingSubscription = this.mensajesService
      .startPollingConversaciones(this.CONVERSACIONES_POLLING_INTERVAL)
      .subscribe({
        next: (conversaciones) => {
          // Solo actualizar si hay cambios
          if (this.hasConversacionesChanged(conversaciones)) {
            this.conversaciones = conversaciones;
          }
        },
        error: (error) => {
          console.error('Error en polling de conversaciones:', error);
        }
      });
  }

  stopConversacionesPolling() {
    if (this.conversacionesPollingSubscription) {
      this.conversacionesPollingSubscription.unsubscribe();
    }
  }

  // Comparar si las conversaciones han cambiado
  private hasConversacionesChanged(newConversaciones: any[]): boolean {
    if (this.conversaciones.length !== newConversaciones.length) return true;
    
    // Verificar si hay cambios en mensajes sin leer
    for (let i = 0; i < this.conversaciones.length; i++) {
      const oldConv = this.conversaciones[i];
      const newConv = newConversaciones.find(c => c.id === oldConv.id);
      
      if (!newConv) return true;
      if (oldConv.sin_leer !== newConv.sin_leer) return true;
      if (oldConv.ultimo_mensaje?.id !== newConv.ultimo_mensaje?.id) return true;
    }
    
    return false;
  }

  cargarMisTrainees() {
    this.entrenadorService.getTrainees().subscribe({
      next: (trainees) => {
        this.misTrainees = trainees;
      },
      error: (error) => {
        console.error('Error cargando trainees:', error);
      }
    });
  }

  iniciarNuevoChat() {
    if (!this.traineeSeleccionadoId) return;
    
    const trainee = this.misTrainees.find(t => t.id === this.traineeSeleccionadoId);
    if (trainee) {
      this.seleccionarConversacion(trainee);
      this.mostrarModalNuevoChat = false;
      this.traineeSeleccionadoId = null;
    }
  }

  seleccionarConversacion(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.usuarioSeleccionadoId = usuario.id;
    this.cargarMensajes(usuario.id);
    this.router.navigate(['/entrenador/chat', usuario.id]);
    
    // Iniciar polling para esta conversación
    this.startPolling(usuario.id);
  }

  seleccionarConversacionPorId(usuarioId: number) {
    const usuario = this.conversaciones.find(c => c.id === usuarioId);
    if (usuario) {
      this.seleccionarConversacion(usuario);
    } else {
      // Buscar en mis trainees si no está en conversaciones
      const trainee = this.misTrainees.find(t => t.id === usuarioId);
      if (trainee) {
        this.seleccionarConversacion(trainee);
      }
    }
  }

  cargarMensajes(usuarioId: number) {
    this.cargandoMensajes = true;
    this.mensajesService.getConversacion(usuarioId).subscribe({
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
  startPolling(usuarioId: number) {
    this.stopPolling();
    
    this.pollingSubscription = this.mensajesService
      .startPollingConversacion(usuarioId, this.POLLING_INTERVAL)
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
    if (!this.nuevoMensaje.trim() || !this.usuarioSeleccionado) return;

    this.enviando = true;
    this.mensajesService.enviarMensaje(this.usuarioSeleccionado.id, this.nuevoMensaje).subscribe({
      next: (mensaje) => {
        // Añadir el mensaje localmente inmediatamente
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.enviando = false;
        
        // Notificar al servicio para posibles listeners
        this.mensajesService.notifyNewMessage(mensaje);
        
        // Forzar actualización de conversaciones
        this.cargarConversaciones();
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