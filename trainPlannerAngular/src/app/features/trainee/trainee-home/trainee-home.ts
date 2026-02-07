import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trainee-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trainee-home.html',
  styleUrl: './trainee-home.scss',
})
export class TraineeHomeComponent {}