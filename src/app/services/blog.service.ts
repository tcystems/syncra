import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private apiUrl = 'https://script.google.com/macros/s/AKfycbzgElJoB_iuLjLnJkSSNc2OXrL8F_YP1aJti0c8W0kmV4LQ-mfQ5ASzjpnIZL73Yt_OuQ/exec';

  constructor(private http: HttpClient) { }

  getBlogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?action=getAll`);
  }

  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?action=getSingle&slug=${slug}`);
  }
}
