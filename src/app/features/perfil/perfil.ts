import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-perfil',
  imports: [CommonModule],
  templateUrl: './perfil.html'
})
export class PerfilComponent {

  user: any = null;
  selectedFile: File | null = null;

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
        }
      });
  }
}
