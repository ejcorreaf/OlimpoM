import { Component, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule, SuccessModalComponent],
  templateUrl: './perfil.html'
})
export class PerfilComponent implements OnInit {
  user: any = null;
  selectedFile: File | null = null;
  successModal = viewChild.required<SuccessModalComponent>('successModal');
  needsVerification = false;
  resendingEmail = false;
  resendSuccess = false;

  constructor(
    private auth: AuthService, 
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.auth.user$.subscribe(u => this.user = u);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.needsVerification = params['needsVerification'] === 'true';
    });
  }

  getUserRole(): string {
    return this.auth.getUserRole();
  }

  needsEmailVerification(): boolean {
    return this.auth.needsEmailVerification();
  }

  resendVerificationEmail() {
    this.resendingEmail = true;
    this.auth.resendVerificationEmail().subscribe({
      next: () => {
        this.resendSuccess = true;
        this.resendingEmail = false;
      },
      error: () => {
        this.resendingEmail = false;
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.http.post('http://localhost:8000/api/user/photo', formData)
      .subscribe({
        next: (res: any) => {
          this.user.photo_url = res.photo_url;
          this.auth.updateUser(this.user);
        }
      });
  }

  updateNotes() {
    this.http.patch('http://localhost:8000/api/user/notes', { notes: this.user.notes })
      .subscribe({
        next: (res: any) => {
          this.auth.updateUser(res.user);
          this.successModal().show();
        },
        error: (err) => {
          console.error('Error al actualizar notas', err);
        }
      });
  }
}