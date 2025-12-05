import { Component, OnInit, viewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal';
import { AuthService, User } from '../../core/services/auth';
import { SubscriptionStatusComponent } from "../subscription/subscription-status/subscription-status";

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessModalComponent, SubscriptionStatusComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss']
})
export class PerfilComponent implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  
  user: User | null = null;
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  resendingEmail = false;
  resendSuccess = false;
  uploadingPhoto = false;
  showSuccessMessage = false;
  
  // Señal para forzar actualización de la foto
  photoCacheBuster = signal(Date.now());

  successModal = viewChild<SuccessModalComponent>('successModal');

  ngOnInit() {
    this.auth.user$.subscribe(u => {
      this.user = u;
    });
  }

  getUserRole(): string {
    return this.auth.getUserRole();
  }

  needsEmailVerification(): boolean {
    return this.auth.needsEmailVerification();
  }

  // Método para obtener la URL de la foto con cache buster
  getUserPhotoUrl(): string {
    if (!this.user) return '';
    
    let photoUrl = this.user.photo_url || 
                   `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name)}&background=random&size=120`;
    
    // Añadir timestamp para romper el cache
    if (this.user.photo_url) {
      const separator = photoUrl.includes('?') ? '&' : '?';
      photoUrl += `${separator}_=${this.photoCacheBuster()}`;
    }
    
    return photoUrl;
  }

  onPhotoLoaded() {
    console.log('Foto cargada correctamente');
  }

  onPhotoError() {
    console.warn('Error cargando la foto');
    // Si hay error, intentar sin cache buster
    if (this.user?.photo_url) {
      const img = document.getElementById('current-profile-photo') as HTMLImageElement;
      if (img) {
        img.src = this.user.photo_url;
      }
    }
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      this.photoPreview = null;
      return;
    }
    
    const file = input.files[0];
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen (JPG, PNG, etc.)');
      input.value = '';
      this.selectedFile = null;
      this.photoPreview = null;
      return;
    }
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB');
      input.value = '';
      this.selectedFile = null;
      this.photoPreview = null;
      return;
    }
    
    this.selectedFile = file;
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.photoPreview = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  cancelPhotoSelection() {
    this.selectedFile = null;
    this.photoPreview = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  upload() {
    if (!this.selectedFile || !this.user) return;

    this.uploadingPhoto = true;
    this.showSuccessMessage = false;
    
    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.http.post('http://localhost:8000/api/user/photo', formData).subscribe({
      next: (response: any) => {
        this.uploadingPhoto = false;
        console.log('Respuesta del servidor:', response);
        
        if (response.user) {
          // 1. Actualizar el usuario en AuthService
          this.auth.updateUser(response.user);
          
          // 2. Actualizar localmente
          this.user = response.user;
          
          // 3. FORZAR ACTUALIZACIÓN DE LA FOTO EN EL DOM
          this.forcePhotoUpdate(response.user.photo_url);
          
          // 4. Actualizar el cache buster
          this.photoCacheBuster.set(Date.now());
        }
        
        // 5. Limpiar selección
        this.selectedFile = null;
        this.photoPreview = null;
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // 6. Mostrar mensaje de éxito
        this.showSuccessMessage = true;
        
        // 7. Ocultar mensaje después de 5 segundos
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Error subiendo foto:', error);
        this.uploadingPhoto = false;
        
        let errorMessage = 'Error al subir la foto';
        if (error.error?.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.status === 413) {
          errorMessage = 'La imagen es demasiado grande';
        } else if (error.status === 415) {
          errorMessage = 'Formato de imagen no soportado';
        }
        
        alert(errorMessage);
      }
    });
  }

  // MÉTODO CLAVE: Forzar actualización de la foto en el DOM
  private forcePhotoUpdate(photoUrl: string | null) {
    if (!photoUrl) return;
    
    setTimeout(() => {
      const imgElement = document.getElementById('current-profile-photo') as HTMLImageElement;
      if (imgElement) {
        // TRUCO NUCLEAR: Crear una nueva imagen y reemplazar
        const newImg = new Image();
        const timestamp = Date.now();
        newImg.src = `${photoUrl}?nuke=${timestamp}`;
        newImg.className = imgElement.className;
        newImg.style.cssText = imgElement.style.cssText;
        newImg.width = 120;
        newImg.height = 120;
        newImg.id = 'current-profile-photo';
        
        newImg.onload = () => {
          console.log('Nueva imagen cargada, reemplazando...');
          // Reemplazar el elemento viejo con el nuevo
          imgElement.parentNode?.replaceChild(newImg, imgElement);
          
          // Añadir event listeners al nuevo elemento
          newImg.addEventListener('load', () => this.onPhotoLoaded());
          newImg.addEventListener('error', () => this.onPhotoError());
        };
        
        newImg.onerror = () => {
          console.warn('Error cargando nueva imagen, usando fallback');
          imgElement.src = photoUrl;
        };
      }
    }, 100);
  }

  updateNotes() {
    if (!this.user) return;

    this.http.patch('http://localhost:8000/api/user/notes', {
      notes: this.user.notes
    }).subscribe({
      next: (response: any) => {
        if (response.user) {
          this.auth.updateUser(response.user);
          this.user = response.user;
        }
        
        const modal = this.successModal();
        if (modal) {
          modal.show();
        }
      },
      error: (error) => {
        console.error('Error actualizando notas:', error);
        alert('Error al guardar las notas');
      }
    });
  }

  resendVerificationEmail() {
    this.resendingEmail = true;
    this.auth.resendVerificationEmail().subscribe({
      next: () => {
        this.resendSuccess = true;
        this.resendingEmail = false;
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
          this.resendSuccess = false;
        }, 5000);
      },
      error: () => {
        this.resendingEmail = false;
      }
    });
  }
}