import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { EntrenadorService, Mensaje, TraineeAsignado } from '../../../core/services/entrenador';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
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

  ngOnInit() {
    // Obtener el ID del usuario actual
    this.authService.user$.subscribe(user => {
      if (user) {
        this.miUsuarioId = user.id;
      }
    });
    
    this.cargarConversaciones();
    this.cargarMisTrainees();
    
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

  cargarMisTrainees() {
  this.entrenadorService.getTrainees().subscribe({ // SOLO getTrainees()
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

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.usuarioSeleccionado) return;

    this.enviando = true;
    this.mensajesService.enviarMensaje(this.usuarioSeleccionado.id, this.nuevoMensaje).subscribe({
      next: (mensaje) => {
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.enviando = false;
        
        // Actualizar conversaciones
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
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}