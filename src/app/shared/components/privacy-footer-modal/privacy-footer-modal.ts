import { Component, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-privacy-footer-modal',
  templateUrl: './privacy-footer-modal.html',
  imports: [
    CommonModule
  ]
})
export class PrivacyFooterModalComponent {
  modalElement = viewChild<ElementRef>('privacyFooterModal');
  private modal: any;
  private modalInitialized = false;

  getCurrentDate(): string {
  return new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    });
  }



  show() {
    if (!this.modalInitialized) {
      const element = this.modalElement();
      if (element) {
        this.modal = new bootstrap.Modal(element.nativeElement);
        this.modalInitialized = true;
      }
    }
    
    if (this.modal) {
      this.modal.show();
    }
  }

  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }
}