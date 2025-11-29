import { Component, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { PrivacyModalComponent } from '../../../shared/components/privacy-modal/privacy-modal';
import { DniValidatorDirective } from '../../../core/directives/dni-validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    PrivacyModalComponent,
    DniValidatorDirective
  ]
})
export class RegisterComponent {
  privacyModal = viewChild.required<PrivacyModalComponent>('privacyModal');

  registerForm: FormGroup;
  errorRegistro = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],      
      dni: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, this.matchPasswordValidator.bind(this)]],
      notes: [''],
      privacyPolicy: [false, Validators.requiredTrue]
    });
  }

  matchPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const password = this.registerForm?.get('password')?.value;
    const confirmPassword = control.value;
    
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  register() {
    if (this.registerForm.invalid) return;

    this.errorRegistro = false;

    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.error?.errors?.email) {
          this.registerForm.get('email')?.setErrors({ emailTaken: true });
        }
        if (err.error?.errors?.dni) {
          this.registerForm.get('dni')?.setErrors({ dniTaken: true });
        }
        this.errorRegistro = true;
      }
    });
  }

  openPrivacyPolicy(event: Event) {
    event.preventDefault();
    this.privacyModal()?.show();
  }

  onPrivacyAccepted() {
    this.registerForm.patchValue({
      privacyPolicy: true
    });
  }
}