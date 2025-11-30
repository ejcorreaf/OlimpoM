import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api';

  private _user = new BehaviorSubject<any>(null);
  user$ = this._user.asObservable();

  constructor() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this._user.next(JSON.parse(storedUser));
    }

    const token = this.token;
    if (token) {
      this.http.get(`${this.baseUrl}/user`).subscribe({
        next: (user: any) => {
          this._user.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        },
        error: () => {
          console.log('Token puede ser inválido');
        }
      });
    }
  }

  getUserRole(): string {
    const user = this._user.value;
    if (!user) return '';
    
    // Usar la propiedad 'role' que viene del backend
    if (user.role) return user.role;
    
    // Fallback por si acaso
    if (user.roles && user.roles.length > 0) {
      return user.roles[0].name || user.roles[0];
    }
    
    return '';
  }

  isEmailVerified(): boolean {
    const user = this._user.value;
    return user?.email_verified || user?.email_verified_at !== null;
  }

  needsEmailVerification(): boolean {
    const user = this._user.value;
    const role = this.getUserRole();
    
    // SOLO trainees necesitan verificación
    return role === 'trainee' && !this.isEmailVerified();
  }

  login(email: string, password: string): Observable<any> {
    const data = { email, password };

    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap((res: any) => {
        console.log('Login response:', res);

        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this._user.next(res.user);
        }
      })
    );
  }

  // Los demás métodos se mantienen igual...
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this._user.next(null);
      })
    );
  }

  resendVerificationEmail(): Observable<any> {
    return this.http.post(`${this.baseUrl}/email/verification-notification`, {});
  }

  checkVerificationStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/email/verification-status`);
  }

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

  get token(): string | null {
    return localStorage.getItem('token');
  }

  updateUser(updatedUser: any): void {
    this._user.next(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
}