import { Component, viewChild, AfterViewInit, ElementRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-contact-modal',
  templateUrl: './contact-modal.html',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ContactModalComponent implements AfterViewInit {
  modalElement = viewChild<ElementRef>('contactModal');
  
  contactForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', [Validators.required]),
    message: new FormControl('', [Validators.required, Validators.minLength(10)])
  });
  
  private modal: any;
  private modalInitialized = false;
  submitted = false;
  isLoading = false;

  ngAfterViewInit() {
  }

  show() {
    this.contactForm.reset();
    this.submitted = false;
    
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

  onSubmit() {
    this.submitted = true;
    
    if (this.contactForm.valid) {
      this.isLoading = true;
      
      // Simulación de envío de formulario (Más adelante lo haré funcional)
      setTimeout(() => {
        console.log('Formulario enviado:', this.contactForm.value);
        this.isLoading = false;
        this.hide();
        
        alert('¡Mensaje enviado correctamente! Te contactaremos pronto.');
      }, 1500);
    }
  }

  get name() { return this.contactForm.get('name'); }
  get email() { return this.contactForm.get('email'); }
  get subject() { return this.contactForm.get('subject'); }
  get message() { return this.contactForm.get('message'); }
}