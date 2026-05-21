import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, ContactComponent],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss'
})
export class BlogsComponent implements OnInit {
  blogs: any[] = [];
  paginatedBlogs: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalBlogs: number = 0;
  totalPages: number = 0;

  constructor(
    private blogService: BlogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.blogService.getBlogs().subscribe({
      next: (data) => {
        this.blogs = data;
        this.totalBlogs = this.blogs.length;
        this.totalPages = Math.ceil(this.totalBlogs / this.itemsPerPage);
        this.updatePaginatedBlogs();
      },
      error: (err) => console.error('Error fetching blogs:', err)
    });
  }

  updatePaginatedBlogs(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBlogs = this.blogs.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedBlogs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  goToBlog(slug: string): void {
    this.router.navigate(['/blog', slug]);
  }
}
