import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { Mensaje } from '../../../core/services/entrenador';
import { AuthService } from '../../../core/services/auth';
import { Subscription, interval, mergeMap, startWith, distinctUntilChanged } from 'rxjs';

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
  private readonly POLLING_INTERVAL = 3000;
  
  // Control de scroll
  private shouldScrollToBottom = false;
  private isUserScrolling = false;

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.miUsuarioId = user.id;
        this.miEntrenador = user.entrenador_asignado;
        
        if (this.miEntrenador) {
          this.cargarMensajes();
          this.startPolling();
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
    this.stopPolling();
  }

  cargarMensajes() {
    if (!this.miEntrenador) return;
    
    this.cargandoMensajes = true;
    this.mensajesService.getConversacion(this.miEntrenador.id).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        this.cargandoMensajes = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error cargando mensajes:', error);
        this.cargandoMensajes = false;
      }
    });
  }

  startPolling() {
    if (!this.miEntrenador) return;
    
    this.stopPolling();
    
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0),
        mergeMap(() => this.mensajesService.getConversacion(this.miEntrenador.id)),
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

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
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

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.miEntrenador) return;

    this.enviando = true;
    this.mensajesService.enviarMensaje(this.miEntrenador.id, this.nuevoMensaje).subscribe({
      next: (mensaje) => {
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.enviando = false;
        this.shouldScrollToBottom = true;
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