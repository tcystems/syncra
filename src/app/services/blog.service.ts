import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private apiUrl = 'https://script.google.com/macros/s/AKfycbwqVvGC3qPOBCx_eIOJmYMxITp8tNKQNJLNkaNkKU7GR20tBz5xM37ZF1SDE8YeDthp/exec';

  constructor(private http: HttpClient) { }

  getBlogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?action=getAll`);
  }

  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?action=getSingle&slug=${slug}`);
  }
}
