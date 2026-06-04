import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private apiUrl = 'https://script.google.com/macros/s/AKfycby5BnGcX_wJ3b2z_de7QU-zqRCJXGF6mbCNi1s_CruUZ8KwY--DPaLCyy3P_8TdfG_J/exec';

  constructor(private http: HttpClient) { }

  getBlogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?action=getAll`);
  }

  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?action=getSingle&slug=${slug}`);
  }
}
