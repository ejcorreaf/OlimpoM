import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.scss']
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  
  subscriptionId: string = '';
  planName: string = '';
  loading = true;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.subscriptionId = params['subscription_id'] || '';
      this.planName = params['plan'] || 'Premium';
      
      if (this.subscriptionId) {
        this.verifyPayment();
      } else {
        this.loading = false;
      }
    });
  }

  verifyPayment() {
    this.subscriptionService.checkPaymentStatus(this.subscriptionId).subscribe({
      next: (response) => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error verifying payment:', error);
        this.loading = false;
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/trainee/home']);
  }

  goToRoutines() {
    this.router.navigate(['/trainee/rutinas']);
  }
}