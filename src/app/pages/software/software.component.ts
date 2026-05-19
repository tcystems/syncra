import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
  selector: 'app-software',
  standalone: true,
  imports: [CommonModule, ContactComponent],
  templateUrl: './software.component.html',
  styleUrl: './software.component.scss'
})
export class SoftwareComponent {

}
