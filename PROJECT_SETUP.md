# Syncra - Angular 20 Marketing Website

A modern, responsive marketing website built with Angular 20 and best practices.

## Project Structure

```
src/
├── app/
│   ├── components/              # Reusable UI components
│   │   ├── header/             # Navigation header
│   │   └── footer/             # Footer section
│   ├── pages/                  # Page components
│   │   └── home.component      # Home page
│   ├── services/               # API services (optional)
│   ├── models/                 # TypeScript interfaces/types
│   ├── app.component.*         # Root component
│   └── app.routes.ts           # Route configuration
├── styles/                     # Global SCSS styles
│   ├── _variables.scss         # Colors, spacing, fonts
│   ├── _mixins.scss            # Reusable SCSS mixins
│   └── _reset.scss             # CSS reset & base styles
├── environments/               # Environment configs
│   ├── environment.ts          # Development
│   ├── environment.prod.ts     # Production
│   └── environment.staging.ts  # Staging
├── assets/                     # Images, icons, data
├── main.ts                     # Application entry point
├── index.html                  # HTML template
└── styles.scss                 # Main stylesheet
```

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
ng serve
# Navigate to http://localhost:4200/
```

### Build for Production
```bash
ng build --configuration production
```

### Build for Staging
```bash
ng build --configuration staging
```

## Features

✅ **Modern Angular 20** - Latest framework features
✅ **Responsive Design** - Mobile, tablet, and desktop
✅ **SCSS with Mixins** - Organized styling with variables
✅ **Standalone Components** - Modern Angular architecture
✅ **Component Structure** - Well-organized folder hierarchy
✅ **Environment Configuration** - Dev, staging, prod configs
✅ **Responsive Utilities** - Mobile-first breakpoints

## Adding Pages

1. Create a component in `src/app/pages/`
2. Add route to `src/app/app.routes.ts`
3. Add navigation link in `src/app/components/header/`

Example:
```typescript
// pages/about.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {}
```

Add to routes:
```typescript
{ path: 'about', component: AboutComponent }
```

## Styling Guide

### Using Variables
```scss
@import '../styles/variables';

.button {
  background-color: $primary-color;
  padding: $spacing-md;
  border-radius: $border-radius-md;
}
```

### Using Mixins
```scss
@import '../styles/mixins';

.header {
  @include flex-between;
  @include elevation(1);
  
  @include mobile-only {
    flex-direction: column;
  }
}
```

### Responsive Breakpoints
- `$mobile: 480px`
- `$tablet: 768px`
- `$desktop: 1024px`
- `$wide: 1440px`

## Best Practices

✓ Keep components focused and single-responsibility
✓ Use SCSS variables for colors and spacing
✓ Use mixins for common patterns
✓ Organize imports logically
✓ Use standalone components (modern approach)
✓ Implement OnPush change detection for performance
✓ Keep services in `services/` folder
✓ Keep types in `models/` folder

## Available Scripts

```bash
ng serve              # Start dev server
ng build              # Build for production
ng test               # Run unit tests
ng lint               # Run linter
ng generate           # Generate components, services, etc.
```

## Environment Variables

Update configs in `src/environments/`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
  appName: 'Syncra'
};
```

## Performance Tips

- Use `OnPush` change detection
- Lazy load routes for large apps
- Optimize images for web
- Minify assets for production
- Use SCSS variables instead of inline values
- Leverage Angular's built-in optimization

## Next Steps

1. Customize colors in `src/styles/_variables.scss`
2. Add your content to pages
3. Update header navigation links
4. Add more pages and components
5. Configure API endpoints in services
6. Deploy to your hosting platform

## License

MIT

## Support

For Angular documentation, visit https://angular.dev
