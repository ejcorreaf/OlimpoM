import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-cancel.html',
  styleUrls: ['./payment-cancel.scss']
})
export class PaymentCancelComponent {
  constructor(private router: Router) {}

  goToPlans() {
    this.router.navigate(['/subscription/plans']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}