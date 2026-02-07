import { Component, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrivacyFooterModalComponent } from '../components/privacy-footer-modal/privacy-footer-modal';
import { ContactModalComponent } from '../components/contact-modal/contact-modal';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [
    CommonModule,
    RouterModule,
    PrivacyFooterModalComponent,
    ContactModalComponent
  ]
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
  
  privacyModal = viewChild<PrivacyFooterModalComponent>('privacyModal');
  contactModal = viewChild<ContactModalComponent>('contactModal');

  openPrivacyModal() {
    const modal = this.privacyModal();
    if (modal) {
      modal.show();
    }
  }

  openContactModal() {
    const modal = this.contactModal();
    if (modal) {
      modal.show();
    }
  }
}