import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-privacy-modal',  
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './privacy-modal.html',
})
export class PrivacyModalComponent implements AfterViewInit, OnDestroy {
  @Output() accepted = new EventEmitter<void>();
  @ViewChild('privacyModal') modalElement!: ElementRef;

  acceptControl = new FormControl(false);
  private modal: any;

  ngAfterViewInit() {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
  }

  ngOnDestroy() {
    if (this.modal) {
      this.modal.dispose();
    }
  }

  show() {
    this.acceptControl.setValue(false);
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  onAccept() {
    if (this.acceptControl.value) {
      this.accepted.emit();
      this.hide();
    }
  }
}