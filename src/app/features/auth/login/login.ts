import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {

  // Mensaje de error al iniciar sesión
  error = '';

  // Formulario de inicio de sesión
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  /**
   * Inicia sesión del usuario
   */
  onSubmit() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: (res: any) => {
        // Usar auth.getUserRole() en lugar de res.user.role para garantizar reactividad
        const role = this.auth.getUserRole();
        const homeRoute = this.auth.getHomeRouteByRole(role);
        this.router.navigate([homeRoute]);
      },
      error: () => {
        this.error = 'Credenciales incorrectas';
      }
    });
  }
}