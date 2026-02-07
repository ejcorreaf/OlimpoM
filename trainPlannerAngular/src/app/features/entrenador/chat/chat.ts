import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { EntrenadorService, Mensaje, TraineeAsignado } from '../../../core/services/entrenador';
import { AuthService } from '../../../core/services/auth';
import { Subscription, interval, mergeMap, startWith, distinctUntilChanged } from 'rxjs';

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
  // Chats creados localmente que aún no están en el backend
  conversacionesLocales: any[] = [];
  mensajes: Mensaje[] = [];
  usuarioSeleccionado: any = null;
  usuarioSeleccionadoId: number | null = null;
  miUsuarioId: number = 0;
  nuevoMensaje = '';
  cargandoMensajes = false;
  cargandoConversaciones = false;
  enviando = false;
  
  // Nuevas variables para iniciar chat
  mostrarModalNuevoChat = false;
  traineeSeleccionadoId: string = '';
  misTrainees: TraineeAsignado[] = [];
  misTraineesCompletos: TraineeAsignado[] = [];
  
  // Variables para polling
  private mensajesPollingSubscription?: Subscription;
  private conversacionesPollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000;
  private readonly CONVERSACIONES_POLLING_INTERVAL = 5000;
  
  // Control de scroll
  private shouldScrollToBottom = false;
  private isUserScrolling = false;

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.miUsuarioId = user.id;
      }
    });
    
    this.cargarConversacionesInicial();
    this.cargarTodosMisTrainees();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        const userId = parseInt(params['id']);
        if (!isNaN(userId)) {
          this.seleccionarConversacionPorId(userId);
        }
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom && !this.isUserScrolling) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.stopMensajesPolling();
    this.stopConversacionesPolling();
  }

  // ========== CONVERSACIONES ==========

  cargarConversacionesInicial() {
    this.cargandoConversaciones = true;
    this.mensajesService.getConversaciones().subscribe({
      next: (conversaciones) => {
        this.conversaciones = conversaciones;
        this.cargandoConversaciones = false;
        
        this.filtrarTraineesDisponibles();
        
        if (!this.usuarioSeleccionado && conversaciones.length > 0) {
          this.seleccionarConversacion(conversaciones[0]);
        }
        
        this.startConversacionesPolling();
      },
      error: (error) => {
        console.error('Error cargando conversaciones:', error);
        this.cargandoConversaciones = false;
      }
    });
  }

  cargarConversaciones() {
    this.mensajesService.getConversaciones().subscribe({
      next: (conversaciones) => {
        // Mantener conversaciones locales que no están en el backend
        const conversacionesActualizadas = [...conversaciones];
        
        // Añadir conversaciones locales que no están en el backend
        this.conversacionesLocales.forEach(convLocal => {
          const existeEnBackend = conversaciones.some(convBackend => convBackend.id === convLocal.id);
          if (!existeEnBackend) {
            conversacionesActualizadas.push(convLocal);
          }
        });
        
        this.conversaciones = conversacionesActualizadas;
        this.filtrarTraineesDisponibles();
      },
      error: (error) => {
        console.error('Error cargando conversaciones:', error);
      }
    });
  }

  startConversacionesPolling() {
    this.stopConversacionesPolling();
    
    this.conversacionesPollingSubscription = interval(this.CONVERSACIONES_POLLING_INTERVAL)
      .pipe(
        startWith(0),
        mergeMap(() => this.mensajesService.getConversaciones()),
        distinctUntilChanged((prev, curr) => 
          JSON.stringify(prev) === JSON.stringify(curr)
        )
      )
      .subscribe({
        next: (conversaciones) => {
          // Combinar conversaciones del backend con locales
          const conversacionesActualizadas = [...conversaciones];
          
          this.conversacionesLocales.forEach(convLocal => {
            const existeEnBackend = conversaciones.some(convBackend => convBackend.id === convLocal.id);
            if (!existeEnBackend) {
              conversacionesActualizadas.push(convLocal);
            } else {
              // Si ya existe en backend, eliminar de locales
              this.conversacionesLocales = this.conversacionesLocales.filter(c => c.id !== convLocal.id);
            }
          });
          
          this.conversaciones = conversacionesActualizadas;
          this.filtrarTraineesDisponibles();
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

  // ========== TRAINEES ==========

  cargarTodosMisTrainees() {
    this.entrenadorService.getTrainees().subscribe({
      next: (trainees) => {
        this.misTraineesCompletos = trainees;
        this.filtrarTraineesDisponibles();
      },
      error: (error) => {
        console.error('Error cargando trainees:', error);
      }
    });
  }

  filtrarTraineesDisponibles() {
    if (this.misTraineesCompletos.length === 0) return;
    
    this.misTrainees = this.misTraineesCompletos.filter(trainee => {
      const tieneConversacion = this.conversaciones.some(conv => conv.id === trainee.id) ||
                               this.conversacionesLocales.some(conv => conv.id === trainee.id);
      return !tieneConversacion;
    });
  }

  // ========== SELECCIÓN DE CONVERSACIONES ==========

  seleccionarConversacion(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.usuarioSeleccionadoId = usuario.id;
    this.router.navigate(['/entrenador/chat', usuario.id]);
    
    this.shouldScrollToBottom = false;
    this.cargarMensajes(usuario.id);
  }

  seleccionarConversacionPorId(usuarioId: number) {
    // Buscar primero en conversaciones combinadas
    const todasConversaciones = [...this.conversaciones, ...this.conversacionesLocales];
    const usuario = todasConversaciones.find(c => c.id === usuarioId);
    
    if (usuario) {
      this.seleccionarConversacion(usuario);
      return;
    }
    
    // Buscar en trainees
    const traineeEnTrainees = this.misTraineesCompletos.find(t => t.id === usuarioId);
    if (traineeEnTrainees) {
      this.seleccionarConversacion(traineeEnTrainees);
    }
  }

  // ========== MENSAJES ==========

  cargarMensajes(usuarioId: number) {
    this.cargandoMensajes = true;
    this.mensajes = [];
    
    this.mensajesService.getConversacion(usuarioId).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        this.cargandoMensajes = false;
        this.shouldScrollToBottom = true;
        this.startMensajesPolling(usuarioId);
      },
      error: (error) => {
        console.error('Error cargando mensajes:', error);
        this.cargandoMensajes = false;
      }
    });
  }

  startMensajesPolling(usuarioId: number) {
    this.stopMensajesPolling();
    
    this.mensajesPollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        mergeMap(() => this.mensajesService.getConversacion(usuarioId)),
        distinctUntilChanged((prev, curr) => {
          if (prev.length !== curr.length) return false;
          if (prev.length === 0 && curr.length === 0) return true;
          return prev[prev.length - 1]?.id === curr[curr.length - 1]?.id;
        })
      )
      .subscribe({
        next: (mensajes) => {
          if (this.hasNewMessages(mensajes)) {
            this.mensajes = mensajes;
            if (this.isAtBottom()) {
              this.shouldScrollToBottom = true;
            }
          }
        },
        error: (error) => {
          console.error('Error en polling de mensajes:', error);
        }
      });
  }

  stopMensajesPolling() {
    if (this.mensajesPollingSubscription) {
      this.mensajesPollingSubscription.unsubscribe();
    }
  }

  private hasNewMessages(newMensajes: Mensaje[]): boolean {
    if (this.mensajes.length !== newMensajes.length) return true;
    
    if (this.mensajes.length > 0 && newMensajes.length > 0) {
      return this.mensajes[this.mensajes.length - 1].id !== 
             newMensajes[newMensajes.length - 1].id;
    }
    
    return false;
  }

  // ========== NUEVOS CHATS ==========

  abrirModalNuevoChat() {
    this.mostrarModalNuevoChat = true;
    this.traineeSeleccionadoId = '';
    this.cargarTodosMisTrainees();
  }

  iniciarNuevoChat() {
    if (!this.traineeSeleccionadoId) {
      console.error('No se ha seleccionado ningún trainee');
      return;
    }
    
    const traineeId = Number(this.traineeSeleccionadoId);
    
    if (isNaN(traineeId)) {
      console.error('ID del trainee no es un número:', this.traineeSeleccionadoId);
      return;
    }
    
    const trainee = this.misTraineesCompletos.find(t => t.id === traineeId);
    
    if (!trainee) {
      console.error('Trainee no encontrado. ID:', traineeId);
      return;
    }
    
    // Crear objeto de conversación local
    const nuevaConversacion = {
      ...trainee,
      ultimo_mensaje: null,
      sin_leer: 0,
      esLocal: true // Marcar como conversación local
    };
    
    // Añadir a conversaciones locales
    this.conversacionesLocales.push(nuevaConversacion);
    
    // Añadir también a la lista principal
    this.conversaciones.unshift(nuevaConversacion);
    
    // Seleccionar la conversación
    this.seleccionarConversacion(nuevaConversacion);
    
    // Cerrar modal y resetear
    this.mostrarModalNuevoChat = false;
    this.traineeSeleccionadoId = '';
    
    // Actualizar lista de trainees disponibles
    this.filtrarTraineesDisponibles();
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.usuarioSeleccionado) return;

    this.enviando = true;
    this.mensajesService.enviarMensaje(this.usuarioSeleccionado.id, this.nuevoMensaje).subscribe({
      next: (mensaje) => {
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.enviando = false;
        this.shouldScrollToBottom = true;
        
        // Si la conversación era local, eliminar la marca
        if (this.usuarioSeleccionado.esLocal) {
          this.usuarioSeleccionado.esLocal = false;
          this.conversacionesLocales = this.conversacionesLocales.filter(c => c.id !== this.usuarioSeleccionado.id);
        }
        
        this.cargarConversaciones();
      },
      error: (error) => {
        console.error('Error enviando mensaje:', error);
        this.enviando = false;
      }
    });
  }

  // ========== SCROLL ==========

  private scrollToBottom(): void {
    try {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  onChatScroll() {
    const element = this.chatContainer?.nativeElement;
    if (!element) return;
    
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (!isAtBottom) {
      this.isUserScrolling = true;
      setTimeout(() => {
        this.isUserScrolling = false;
      }, 2000);
    } else {
      this.isUserScrolling = false;
    }
  }

  private isAtBottom(): boolean {
    const element = this.chatContainer?.nativeElement;
    if (!element) return true;
    
    return element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
  }

  // ========== UTILIDADES ==========

  formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  }
}