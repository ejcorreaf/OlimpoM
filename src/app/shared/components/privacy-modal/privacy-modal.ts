import { Component, Output, EventEmitter, viewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-privacy-modal',
  templateUrl: './privacy-modal.html',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class PrivacyModalComponent implements AfterViewInit, OnDestroy {
  @Output() accepted = new EventEmitter<void>();
  
  // Cambia a viewChild normal (no required)
  modalElement = viewChild<ElementRef>('privacyModal');
  
  acceptControl = new FormControl(false);
  private modal: any;
  private modalInitialized = false;

  ngAfterViewInit() {
    // Inicializar el modal cuando se necesite, no inmediatamente
  }

  ngOnDestroy() {
    if (this.modal) {
      this.modal.dispose();
    }
  }

  show() {
    this.acceptControl.setValue(false);
    
    // Inicializar el modal solo cuando se va a mostrar
    if (!this.modalInitialized) {
      const element = this.modalElement();
      if (element) {
        this.modal = new bootstrap.Modal(element.nativeElement, {
          backdrop: 'static',
          keyboard: false
        });
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

  onAccept() {
    if (this.acceptControl.value) {
      this.accepted.emit();
      this.hide();
    }
  }
}