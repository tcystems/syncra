import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ContactComponent } from '../../components/contact/contact.component';

interface CalendarCell {
  day: number | null;
  isToday: boolean;
}

interface UsTimezone {
  abbr: string;
  label: string;
}

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContactComponent],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss'
})
export class ServiceDetailComponent implements OnInit {
  service: any = null;
  error: boolean = false;

  // ── Booking Modal ────────────────────────────────────────────────
  showBookingModal = false;

  dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  private calendarDate = new Date();
  currentMonthLabel = '';
  calendarCells: CalendarCell[] = [];
  selectedDay: number | null = null;

  usTimezones: UsTimezone[] = [
    { abbr: 'ET',  label: 'Eastern Time (ET)  — UTC−5/UTC−4' },
    { abbr: 'CT',  label: 'Central Time (CT)  — UTC−6/UTC−5' },
    { abbr: 'MT',  label: 'Mountain Time (MT) — UTC−7/UTC−6' },
    { abbr: 'PT',  label: 'Pacific Time (PT)  — UTC−8/UTC−7' },
    { abbr: 'AKT', label: 'Alaska Time (AKT)  — UTC−9/UTC−8' },
    { abbr: 'HT',  label: 'Hawaii Time (HT)   — UTC−10'      },
  ];

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

  timeSlots: string[] = this.rawSlots;

  bookingForm = {
    timezone: '',
    time: '',
    service: '',
    company: '',
    email: '',
    phone: ''
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.buildCalendar();
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

  // ── Modal ───────────────────────────────────────────────────────
  openDemoModal(productName: string): void {
    const today = new Date();
    this.calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDay = today.getDate();
    this.buildCalendar();
    // Reset form but pre-fill the service with the product name
    this.bookingForm = {
      timezone: '',
      time: '',
      service: productName,
      company: '',
      email: '',
      phone: ''
    };
    this.timeSlots = this.rawSlots;
    this.showBookingModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    document.body.style.overflow = '';
  }

  onTimezoneChange(): void {
    const tz = this.bookingForm.timezone;
    this.timeSlots = tz
      ? this.rawSlots.map(slot => `${slot} ${tz}`)
      : this.rawSlots;
    this.bookingForm.time = '';
  }

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

  submitBooking(): void {
    console.log('Demo booking submitted:', {
      date: this.selectedDay
        ? `${this.calendarDate.toLocaleString('default', { month: 'long' })} ${this.selectedDay}, ${this.calendarDate.getFullYear()}`
        : 'No date selected',
      ...this.bookingForm
    });
    this.closeBookingModal();
  }
}
