import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { Mensaje } from '../../../core/services/entrenador';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-trainee-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class TraineeChatComponent implements OnInit, AfterViewChecked {
  private mensajesService = inject(MensajesService);
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
  miEntrenador: any = null;

  ngOnInit() {
    // Obtener usuario actual y su entrenador
    this.authService.user$.subscribe(user => {
      if (user) {
        this.miUsuarioId = user.id;
        this.miEntrenador = user.entrenador_asignado;
        
        // Si hay entrenador pero no está en conversaciones, añadirlo
        if (this.miEntrenador && !this.conversaciones.find(c => c.id === this.miEntrenador.id)) {
          this.conversaciones.unshift({
            ...this.miEntrenador,
            ultimo_mensaje: null,
            sin_leer: 0
          });
        }
      }
    });
    
    this.cargarConversaciones();
    
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
        
        // Asegurar que el entrenador está en las conversaciones
        if (this.miEntrenador && !conversaciones.find(c => c.id === this.miEntrenador.id)) {
          this.conversaciones.unshift({
            ...this.miEntrenador,
            ultimo_mensaje: null,
            sin_leer: 0
          });
        }
        
        // Si no hay usuario seleccionado y hay entrenador, seleccionarlo
        if (!this.usuarioSeleccionado && this.miEntrenador) {
          this.seleccionarConversacion(this.miEntrenador);
        }
      },
      error: (error) => {
        console.error('Error cargando conversaciones:', error);
      }
    });
  }

  seleccionarConversacion(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.usuarioSeleccionadoId = usuario.id;
    this.cargarMensajes(usuario.id);
    this.router.navigate(['/trainee/chat', usuario.id]);
  }

  seleccionarConversacionPorId(usuarioId: number) {
    const usuario = this.conversaciones.find(c => c.id === usuarioId);
    if (usuario) {
      this.seleccionarConversacion(usuario);
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