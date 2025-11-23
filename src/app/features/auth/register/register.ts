import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  imports: [
    ReactiveFormsModule,
    CommonModule
  ]
})
export class RegisterComponent {

  registerForm: FormGroup;
  errorRegistro = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],      
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  register() {
    if (this.registerForm.invalid) return;

    this.errorRegistro = false;

    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        // TODO: redirigir o mostrar modal de éxito
      },
      error: (err) => {
        if (err.error?.errors?.email) {
          this.registerForm.get('email')?.setErrors({ emailTaken: true });
        }

        this.errorRegistro = true;
      }
    });
  }
}
