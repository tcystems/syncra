import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private apiUrl = 'https://script.google.com/macros/s/AKfycbwqVvGC3qPOBCx_eIOJmYMxITp8tNKQNJLNkaNkKU7GR20tBz5xM37ZF1SDE8YeDthp/exec';

  constructor(private http: HttpClient) { }

  /**
   * Converts a Google Drive share URL to a direct embeddable image URL.
   * Handles formats like:
   *   https://drive.google.com/file/d/FILE_ID/view
   *   https://drive.google.com/open?id=FILE_ID
   *   https://drive.google.com/uc?id=FILE_ID
   */
  private toDirectImageUrl(url: string): string {
    if (!url) return url;

    // Already a direct/thumbnail URL
    if (url.includes('thumbnail?id=') || url.includes('uc?export=view')) {
      return url;
    }

    // Extract file ID from /file/d/FILE_ID/... format
    const fileMatch = url.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) {
      return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
    }

    // Extract file ID from ?id=FILE_ID format
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }

    return url;
  }

  private transformBlog(blog: any): any {
    if (blog && blog.imageUrl) {
      blog.imageUrl = this.toDirectImageUrl(blog.imageUrl);
    }
    return blog;
  }

  getBlogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?action=getAll`).pipe(
      map(blogs => blogs.map(b => this.transformBlog(b)))
    );
  }

  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?action=getSingle&slug=${slug}`).pipe(
      map(blog => this.transformBlog(blog))
    );
  }
}
