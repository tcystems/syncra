import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactComponent } from '../../components/contact/contact.component';
import { RouterLink } from '@angular/router';

interface CalendarCell {
  day: number | null;
  isToday: boolean;
}

interface UsTimezone {
  abbr: string;
  label: string;
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

  // ── US Time zones ────────────────────────────────────────────────
  usTimezones: UsTimezone[] = [
    { abbr: 'ET',  label: 'Eastern Time (ET)  — UTC−5/UTC−4'      },
    { abbr: 'CT',  label: 'Central Time (CT)  — UTC−6/UTC−5'      },
    { abbr: 'MT',  label: 'Mountain Time (MT) — UTC−7/UTC−6'      },
    { abbr: 'PT',  label: 'Pacific Time (PT)  — UTC−8/UTC−7'      },
    { abbr: 'AKT', label: 'Alaska Time (AKT)  — UTC−9/UTC−8'      },
    { abbr: 'HT',  label: 'Hawaii Time (HT)   — UTC−10'           },
  ];

  // Raw hour labels; timezone abbreviation appended dynamically
  private readonly rawSlots = [
    '9:00 AM – 10:00 AM',
    '10:00 AM – 11:00 AM',
    '11:00 AM – 12:00 PM',
    '12:00 PM – 1:00 PM',
    '1:00 PM – 2:00 PM',
    '2:00 PM – 3:00 PM',
    '3:00 PM – 4:00 PM',
    '4:00 PM – 5:00 PM',
    '5:00 PM – 6:00 PM',
  ];

  timeSlots: string[] = this.rawSlots; // starts without suffix until tz chosen

  // ── Booking form model ─────────────────────────────────────────
  bookingForm = {
    timezone: '',
    time: '',
    services: [] as string[],
    company: '',
    email: '',
    phone: ''
  };

  // ── Services multi-select ────────────────────────────────────────
  servicesDropdownOpen = false;
  serviceOptions = [
    'Records Retrieval, Billing & Revenue Management',
    'Healthcare Revenue Cycle Management',
    'Technology & Software Solutions',
    'Administrative Support',
    'Finance Solutions',
    'Digital Marketing Solutions',
    'Legal Process Outsourcing'
  ];

  toggleServicesDropdown(): void {
    this.servicesDropdownOpen = !this.servicesDropdownOpen;
  }

  closeServicesDropdown(): void {
    this.servicesDropdownOpen = false;
  }

  toggleService(option: string): void {
    const idx = this.bookingForm.services.indexOf(option);
    if (idx > -1) {
      this.bookingForm.services.splice(idx, 1);
    } else {
      this.bookingForm.services.push(option);
    }
  }

  isServiceSelected(option: string): boolean {
    return this.bookingForm.services.includes(option);
  }

  getServicesLabel(): string {
    if (this.bookingForm.services.length === 0) {
      return 'What type of service are you looking for?';
    }
    if (this.bookingForm.services.length === 1) {
      return this.bookingForm.services[0];
    }
    return `${this.bookingForm.services.length} services selected`;
  }

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
    const today = new Date();
    this.calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDay = today.getDate();
    this.buildCalendar();
    this.showBookingModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    document.body.style.overflow = '';
  }

  // ── Timezone change ─────────────────────────────────────────────
  onTimezoneChange(): void {
    const tz = this.bookingForm.timezone;
    // Rebuild slots with the chosen timezone abbreviation appended
    this.timeSlots = tz
      ? this.rawSlots.map(slot => `${slot} ${tz}`)
      : this.rawSlots;
    // Reset chosen time so user picks again with the new label
    this.bookingForm.time = '';
  }

  // ── Calendar logic ──────────────────────────────────────────────
  buildCalendar(): void {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const today = new Date();

    this.currentMonthLabel = this.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, isToday: false });
    }

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
    this.servicesDropdownOpen = false;
    this.closeBookingModal();
  }
}
