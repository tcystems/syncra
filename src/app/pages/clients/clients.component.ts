import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ContactComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent {}
