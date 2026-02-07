import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-entrenador-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './entrenador-home.html',
  styleUrl: './entrenador-home.scss',
})
export class EntrenadorHomeComponent {}