import { Component } from '@angular/core';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ContactComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

}
