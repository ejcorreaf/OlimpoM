import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-modal.html'
})
export class SuccessModalComponent {
  @Input() message: string = 'Operación completada exitosamente.';
  @Output() closed = new EventEmitter<void>();
  
  isVisible = false;

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.closed.emit();
  }
}