import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-menu',
  imports: [CommonModule,     
            RouterLink,],
  templateUrl: './menu.html',
  styleUrls: ['./menu.scss']
})
export class MenuComponent {

  auth = inject(AuthService); 
  router = inject(Router);

  user: any = null;
  

constructor() {
    // Esto debería detectar cambios cuando _user.next() se llama
    this.auth.user$.subscribe(u => {
      console.log('Usuario actualizado en menu:', u); // Para debug 
      this.user = u;
    });
  }

  ngOnInit() { // ✅ Mueve la suscripción aquí
    this.auth.user$.subscribe(u => {
      console.log('Usuario actualizado en menu:', u);
      this.user = u;
    });
  }


logout() {
  this.auth.logout().subscribe({
    next: () => {
      // Éxito - limpiar y navegar
      this.cleanAndNavigate();
    },
    error: (error) => {
      // Error (token inválido) - limpiar igualmente y navegar
      console.log('Logout falló, limpiando localmente');
      this.cleanAndNavigate();
    }
  });
}

private cleanAndNavigate() {
  // Limpiar todo localmente
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  this.router.navigate(['/login']);
}
}