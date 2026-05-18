import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss'
})
export class ServiceDetailComponent implements OnInit {
  service: any = null;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadServiceData(slug);
      }
    });
  }

  loadServiceData(slug: string): void {
    this.http.get<any[]>('assets/data/services.json').subscribe({
      next: (services) => {
        const found = services.find(s => s.slug === slug);
        if (found) {
          this.service = found;
          this.error = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.error = true;
          this.service = null;
        }
      },
      error: (err) => {
        console.error('Error loading service data:', err);
        this.error = true;
        this.service = null;
      }
    });
  }
}
