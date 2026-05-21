import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactComponent],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss'
})
export class BlogDetailComponent implements OnInit {
  blog: any;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.fetchBlog(slug);
      } else {
        this.error = true;
      }
    });
  }

  fetchBlog(slug: string): void {
    this.blogService.getBlogBySlug(slug).subscribe({
      next: (data) => {
        if (data) {
          this.blog = data;
        } else {
          this.error = true;
        }
      },
      error: (err) => {
        console.error('Error fetching blog details:', err);
        this.error = true;
      }
    });
  }
}
