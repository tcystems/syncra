import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactComponent } from '../../components/contact/contact.component';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ContactComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  activeFaq: number | null = null;
  showBookingModal = false;

  faqs = [
    { question: 'What services does Syncra offer?', answer: 'Syncra provides RCM & Copy Services, Legal Process Outsourcing, Administrative, Finance, and IT Services tailored to your workflow priorities.' },
    { question: 'How quickly can a VA be placed with my practice or firm?', answer: 'We typically place our carefully vetted virtual assistants within 1-2 weeks, depending on the specific requirements of the role.' },
    { question: 'Where are Syncra\'s virtual assistants based?', answer: 'Our dedicated virtual assistants operate from high-quality remote environments globally, ensuring round-the-clock availability and professional compliance.' },
    { question: 'How does Syncra ensure quality and consistency?', answer: 'We ensure high standards through rigorous vetting, comprehensive onboarding centered on US business standards, and continuous performance management.' },
    { question: 'Can Syncra support California Workers\' Compensation practices?', answer: 'Yes, we have specialized teams specifically trained for California Workers\' Compensation copy services, transcription, and record retrieval.' },
    { question: 'Is Syncra right for businesses outside healthcare or legal?', answer: 'While our core expertise lies in healthcare and legal processing, our Finance, IT, and general Administrative virtual assistants serve a variety of industries efficiently.' },
    { question: 'I\'m not sure what I need. Can you help?', answer: 'Absolutely. Contact us to discuss your operational challenges, and we will tailor a bespoke support team that perfectly aligns with your growth goals.' }
  ];

  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }

  openBookingModal() {
    this.showBookingModal = true;
  }

  closeBookingModal() {
    this.showBookingModal = false;
  }
}

