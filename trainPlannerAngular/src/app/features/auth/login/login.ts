import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  error = '';

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
   * Inicio de sesión del usuario
   */
  onSubmit() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: (res: any) => {
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