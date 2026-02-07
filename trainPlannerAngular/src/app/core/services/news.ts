import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  is_published: boolean;
  view_count: number;
  published_at: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getRecentPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts/recent`);
  }

  getPosts(page: number = 1, category?: string): Observable<any> {
    let url = `${this.apiUrl}/posts?page=${page}`;
    if (category) {
      url += `&category=${category}`;
    }
    return this.http.get<any>(url);
  }

  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }
}