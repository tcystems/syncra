import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactComponent } from '../../components/contact/contact.component';
import { RouterLink } from '@angular/router';

interface CalendarCell {
  day: number | null;
  isToday: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ContactComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  activeFaq: number | null = null;
  showBookingModal = false;

  // ── Calendar ────────────────────────────────────────────────────
  dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  private calendarDate = new Date();
  currentMonthLabel = '';
  calendarCells: CalendarCell[] = [];
  selectedDay: number | null = null;

  // ── Booking form model ─────────────────────────────────────────
  bookingForm = {
    time: '',
    service: '',
    company: '',
    email: '',
    phone: ''
  };

  // ── FAQs ────────────────────────────────────────────────────────
  faqs = [
    { question: 'What services does Syncra offer?', answer: 'Syncra provides RCM & Copy Services, Legal Process Outsourcing, Administrative, Finance, and IT Services tailored to your workflow priorities.' },
    { question: 'How quickly can a VA be placed with my practice or firm?', answer: 'We typically place our carefully vetted virtual assistants within 1-2 weeks, depending on the specific requirements of the role.' },
    { question: 'Where are Syncra\'s virtual assistants based?', answer: 'Our dedicated virtual assistants operate from high-quality remote environments globally, ensuring round-the-clock availability and professional compliance.' },
    { question: 'How does Syncra ensure quality and consistency?', answer: 'We ensure high standards through rigorous vetting, comprehensive onboarding centered on US business standards, and continuous performance management.' },
    { question: 'Can Syncra support California Workers\' Compensation practices?', answer: 'Yes, we have specialized teams specifically trained for California Workers\' Compensation copy services, transcription, and record retrieval.' },
    { question: 'Is Syncra right for businesses outside healthcare or legal?', answer: 'While our core expertise lies in healthcare and legal processing, our Finance, IT, and general Administrative virtual assistants serve a variety of industries efficiently.' },
    { question: 'I\'m not sure what I need. Can you help?', answer: 'Absolutely. Contact us to discuss your operational challenges, and we will tailor a bespoke support team that perfectly aligns with your growth goals.' }
  ];

  ngOnInit(): void {
    this.buildCalendar();
  }

  // ── FAQ ─────────────────────────────────────────────────────────
  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }

  // ── Modal ───────────────────────────────────────────────────────
  openBookingModal(): void {
    this.showBookingModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    document.body.style.overflow = '';
  }

  // ── Calendar logic ──────────────────────────────────────────────
  buildCalendar(): void {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const today = new Date();

    this.currentMonthLabel = this.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: CalendarCell[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, isToday: false });
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      cells.push({ day: d, isToday });
    }

    this.calendarCells = cells;
  }

  prevMonth(): void {
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() - 1,
      1
    );
    this.selectedDay = null;
    this.buildCalendar();
  }

  nextMonth(): void {
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() + 1,
      1
    );
    this.selectedDay = null;
    this.buildCalendar();
  }

  selectDay(day: number): void {
    this.selectedDay = day;
  }

  // ── Submit ──────────────────────────────────────────────────────
  submitBooking(): void {
    console.log('Booking submitted:', {
      date: this.selectedDay
        ? `${this.calendarDate.toLocaleString('default', { month: 'long' })} ${this.selectedDay}, ${this.calendarDate.getFullYear()}`
        : 'No date selected',
      ...this.bookingForm
    });
    this.closeBookingModal();
  }
}
