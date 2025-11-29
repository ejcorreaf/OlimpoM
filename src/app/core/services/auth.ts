import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Cliente HTTP para las llamadas a la API
  private http = inject(HttpClient);

  // URL base para todas las peticiones
  private baseUrl = 'http://localhost:8000/api';

  // Contiene el usuario autenticado
  private _user = new BehaviorSubject<any>(null);
  user$ = this._user.asObservable();


constructor() {
  // Recuperar usuario del localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    this._user.next(JSON.parse(storedUser));
  }

  // VERIFICACIÓN SILENCIOSA - no limpiar en error
  const token = this.token;
  if (token) {
    this.http.get(`${this.baseUrl}/user`).subscribe({
      next: (user: any) => {
        this._user.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: () => {
        // NO LIMPIAR aquí - solo log para debug
        console.log('Token puede ser inválido, pero mantenemos estado');
      }
    });
  }
}

//obtener rol del usuario
getUserRole(): string {
  const user = this._user.value;
  if (!user) return '';
  
  // Si tiene propiedad 'role', usarla
  if (user.role) return user.role;
  
  // Si tiene array 'roles', usar el primero
  if (user.roles && user.roles.length > 0) {
    return user.roles[0].name;
  }
  
  return '';
}


  /**
 * Inicia sesión del usuario
 */
login(email: string, password: string): Observable<any> {
  const data = { email, password };

  return this.http.post(`${this.baseUrl}/login`, data).pipe(
    tap((res: any) => {
        console.log('Probando Login response:', res); // ← Añade esto

      // Guarda el token para mantener la sesión
      localStorage.setItem('token', res.token);

      // Guarda el usuario en localStorage
      localStorage.setItem('user', JSON.stringify(res.user));

      // Guarda el usuario en memoria
      this._user.next(res.user);
    })
  );
}
  /**
   * Registra un nuevo usuario
   */
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        // Elimina el token almacenado
        localStorage.removeItem('token');

        // Limpia el usuario en memoria
        this._user.next(null);
      })
    );
  }

  /**
   * Obtiene la ruta de inicio según el rol del usuario
   */
  getHomeRouteByRole(role: string): string {
    switch(role) {
      case 'admin':
        return '/admin/home';
      case 'trainer':
        return '/entrenador/home';
      case 'trainee':
        return '/trainee/home';
      default:
        return '/';
    }
  }

  /**
   * Obtiene el token almacenado
   */
  get token(): string | null {
    return localStorage.getItem('token');
  }


  /**
 * Actualiza el usuario en el servicio y en localStorage
 */
  updateUser(updatedUser: any): void {
    this._user.next(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
}
