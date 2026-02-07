import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-menu',
  imports: [CommonModule,     
            RouterLink,],
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class MenuComponent {

  auth = inject(AuthService); 
  router = inject(Router);

  user: any = null;
  

constructor() {
    this.auth.user$.subscribe(u => {
      console.log('Usuario actualizado en menu:', u);
      this.user = u;
    });
  }

  ngOnInit() {
    this.auth.user$.subscribe(u => {
      console.log('Usuario actualizado en menu:', u);
      this.user = u;
    });
  }


logout() {
  this.auth.logout().subscribe({
    next: () => {
      this.cleanAndNavigate();
    },
    error: (error) => {
      console.log('Logout falló, limpiando localmente');
      this.cleanAndNavigate();
    }
  });
}

private cleanAndNavigate() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  this.router.navigate(['/login']);
}
}