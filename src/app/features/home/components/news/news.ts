import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsService, Post } from '../../../../core/services/news';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news.html',
  styleUrl: './news.scss'
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);
  
  posts: Post[] = [];
  loading = true;
  readMoreMode = false;

  ngOnInit() {
    this.loadRecentPosts();
  }

  loadRecentPosts() {
    this.newsService.getRecentPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading = false;
      }
    });
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'consejos': 'Consejos',
      'nutricion': 'Nutrición',
      'ejercicios': 'Ejercicios',
      'salud': 'Salud',
      'tecnologia': 'Tecnología'
    };
    return labels[category] || category;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  truncateText(text: string, maxLength: number): string {
    const plainText = text.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  }

  getReadingTime(content: string): number {
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }

  toggleReadMore() {
    this.readMoreMode = !this.readMoreMode;
    if (this.readMoreMode) {
      this.newsService.getPosts().subscribe({
        next: (data) => {
          this.posts = data.data || data;
        },
        error: (error) => {
          console.error('Error loading all posts:', error);
        }
      });
    } else {
      this.loadRecentPosts();
    }
  }
}