import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  dni?: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: any[];
  role?: string;
  email_verified?: boolean;
  photo_url?: string;
  notes?: string;
  
  // Campos en español del backend
  estado_suscripcion?: 'activa' | 'expirada' | 'ninguna' | 'pendiente';
  suscripcion_expira_en?: string | null;
  tiene_suscripcion_activa?: boolean;
  plan_nombre?: string;
  plan_precio?: number;
  plan_id?: number;
  
  needs_email_verification?: boolean;
  
  entrenador_asignado?: {
    id: number;
    name: string;
    email: string;
    photo_url?: string;
    role: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api';

  private _user = new BehaviorSubject<User | null>(null);
  user$ = this._user.asObservable();

  constructor() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this._user.next(JSON.parse(storedUser));
    }

    const token = this.token;
    if (token) {
      this.http.get<User>(`${this.baseUrl}/user`).subscribe({
        next: (user: User) => {
          this._user.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        },
        error: () => {
          console.log('Token puede ser inválido');
        }
      });
    }
  }

  getCurrentUser(): User | null {
    return this._user.value;
  }

  getUserRole(): string {
    const user = this._user.value;
    if (!user) return '';
    
    if (user.role) return user.role;
    
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

  hasActiveSubscription(): boolean {
    const user = this._user.value;
    return user?.tiene_suscripcion_activa || false;
  }

  getSubscriptionStatus(): string {
    const user = this._user.value;
    return user?.estado_suscripcion || 'ninguna';
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

  updateUser(updatedUser: User): void {
    this._user.next(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  updateUserSubscriptionStatus(status: 'activa' | 'expirada' | 'ninguna' | 'pendiente', expiresAt?: string): void {
    const currentUser = this._user.value;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        estado_suscripcion: status,
        suscripcion_expira_en: expiresAt,
        tiene_suscripcion_activa: status === 'activa'
      };
      this.updateUser(updatedUser);
    }
  }

  updateUserPhoto(photoUrl: string): void {
    const currentUser = this._user.value;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        photo_url: photoUrl
      };
      this.updateUser(updatedUser);
    }
  }
}