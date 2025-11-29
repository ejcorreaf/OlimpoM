import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
}