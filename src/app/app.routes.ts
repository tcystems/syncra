import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { BlogsComponent } from './pages/blogs/blogs.component';
import { BlogDetailComponent } from './pages/blog-detail/blog-detail.component';
import { SoftwareComponent } from './pages/software/software.component';
import { SoftwareDetailComponent } from './pages/software-detail/software-detail.component';
import { ServiceDetailComponent } from './pages/service-detail/service-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'blogs', component: BlogsComponent },
  { path: 'blog/:slug', component: BlogDetailComponent },
  { path: 'software', component: SoftwareComponent },
  { path: 'software/:slug', component: SoftwareDetailComponent },
  { path: 'services/:slug', component: ServiceDetailComponent },
];
