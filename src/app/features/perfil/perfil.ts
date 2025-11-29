import { Component, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal';

@Component({
  standalone: true,
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule, SuccessModalComponent],
  templateUrl: './perfil.html'
})
export class PerfilComponent {

  user: any = null;
  selectedFile: File | null = null;
  successModal = viewChild.required<SuccessModalComponent>('successModal');

  constructor(private auth: AuthService, private http: HttpClient) {
    this.auth.user$.subscribe(u => this.user = u);
  }

  getUserRole(): string {
    return this.auth.getUserRole();
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