import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  standalone: true,
  selector: 'app-email-verified',
  imports: [CommonModule],
  templateUrl: './email-verified.html'
})
export class EmailVerifiedComponent {
  constructor(private auth: AuthService, private router: Router) {}

  goToHome() {
    const role = this.auth.getUserRole();
    const homeRoute = this.auth.getHomeRouteByRole(role);
    this.router.navigate([homeRoute]);
  }
}