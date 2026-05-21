import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
  selector: 'app-software-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ContactComponent],
  templateUrl: './software-detail.component.html',
  styleUrl: './software-detail.component.scss'
})
export class SoftwareDetailComponent implements OnInit {
  project: any = null;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProjectData(slug);
      }
    });
  }

  loadProjectData(slug: string): void {
    this.http.get<any[]>('assets/data/software.json').subscribe({
      next: (projects) => {
        const found = projects.find(p => p.slug === slug);
        if (found) {
          this.project = found;
          this.error = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.error = true;
          this.project = null;
        }
      },
      error: (err) => {
        console.error('Error loading software project data:', err);
        this.error = true;
        this.project = null;
      }
    });
  }
}
