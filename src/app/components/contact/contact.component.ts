import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  day: number | null;
  isSelected: boolean;
  isToday: boolean;
  date: Date | null;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  selectedTime: string = '01:00 PM';

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  calendarDays: CalendarDay[] = [];

  timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  ngOnInit() {
    // Default select tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDate = tomorrow;
    this.currentDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // First day index (0 = Sunday, 6 = Saturday)
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];

    // Fill leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, isSelected: false, isToday: false, date: null });
    }

    const today = new Date();
    // Fill the actual month days
    for (let d = 1; d <= totalDays; d++) {
      const dDate = new Date(year, month, d);
      const isSelected = this.isSameDay(dDate, this.selectedDate);
      const isToday = this.isSameDay(dDate, today);
      days.push({ day: d, isSelected, isToday, date: dDate });
    }

    this.calendarDays = days;
  }

  isSameDay(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  prevMonth(event: Event) {
    event.preventDefault();
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(event: Event) {
    event.preventDefault();
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(dayInfo: CalendarDay, event: Event) {
    event.preventDefault();
    if (dayInfo.date) {
      this.selectedDate = dayInfo.date;
      this.generateCalendar();
    }
  }

  selectTime(time: string, event: Event) {
    event.preventDefault();
    this.selectedTime = time;
  }

  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    return this.selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Handler for standard 'Leave Us a Message' form
  onLeaveMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    // Validate form inputs
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const selectElement = form.querySelector('select') as HTMLSelectElement;
    const selectedValue = selectElement ? selectElement.value : '';

    // Map selection or page path to GTM service name value
    let serviceName = 'general';
    const path = window.location.pathname.toLowerCase();

    const serviceMap: { [key: string]: string } = {
      'emc-billing': 'copy_services',
      'healthcare-rcm': 'healthcare_rcm',
      'administrative-support': 'administrative_support',
      'finance-solutions': 'finance_solutions',
      'tech-software': 'tech_software',
      'digital-marketing': 'digital_marketing_solutions',
      'legal-process-outsourcing': 'legal_process_outsourcing'
    };

    if (selectedValue && serviceMap[selectedValue]) {
      serviceName = serviceMap[selectedValue];
    } else if (path.includes('emc-billing')) {
      serviceName = 'copy_services';
    } else if (path.includes('healthcare-rcm')) {
      serviceName = 'healthcare_rcm';
    } else if (path.includes('administrative-support')) {
      serviceName = 'administrative_support';
    } else if (path.includes('finance-solutions')) {
      serviceName = 'finance_solutions';
    } else if (path.includes('tech-software')) {
      serviceName = 'tech_software';
    } else if (path.includes('digital-marketing')) {
      serviceName = 'digital_marketing_solutions';
    } else if (path.includes('legal-process-outsourcing')) {
      serviceName = 'legal_process_outsourcing';
    }

    // Initialize dataLayer and push generate_lead event
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'generate_lead',
      service_name: serviceName,
      form_name: 'service_inquiry',
      page_path: window.location.pathname
    });

    // Reset simple form and show success message
    form.reset();
    alert('Thank you for your message! We will get back to you shortly.');
  }

  // Handler for revamped scheduler calendar demo form
  onBookDemo(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    // Validate form inputs
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const selectElement = form.querySelector('select') as HTMLSelectElement;
    const selectedValue = selectElement ? selectElement.value : '';

    // Map selection or page path to GTM service name value
    let serviceName = 'general';
    const path = window.location.pathname.toLowerCase();

    const serviceMap: { [key: string]: string } = {
      'emc-billing': 'copy_services',
      'healthcare-rcm': 'healthcare_rcm',
      'administrative-support': 'administrative_support',
      'finance-solutions': 'finance_solutions',
      'tech-software': 'tech_software',
      'digital-marketing': 'digital_marketing_solutions',
      'legal-process-outsourcing': 'legal_process_outsourcing'
    };

    if (selectedValue && serviceMap[selectedValue]) {
      serviceName = serviceMap[selectedValue];
    } else if (path.includes('emc-billing')) {
      serviceName = 'copy_services';
    } else if (path.includes('healthcare-rcm')) {
      serviceName = 'healthcare_rcm';
    } else if (path.includes('administrative-support')) {
      serviceName = 'administrative_support';
    } else if (path.includes('finance-solutions')) {
      serviceName = 'finance_solutions';
    } else if (path.includes('tech-software')) {
      serviceName = 'tech_software';
    } else if (path.includes('digital-marketing')) {
      serviceName = 'digital_marketing_solutions';
    } else if (path.includes('legal-process-outsourcing')) {
      serviceName = 'legal_process_outsourcing';
    }

    // Initialize dataLayer and push generate_lead event
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'generate_lead',
      service_name: serviceName,
      form_name: 'demo_booking',
      page_path: window.location.pathname,
      booking_date: this.formatSelectedDate(),
      booking_time: this.selectedTime
    });

    // Reset calendar form and show success message
    form.reset();
    alert(`Thank you! Your appointment / demo has been scheduled for ${this.formatSelectedDate()} at ${this.selectedTime}. We have sent a confirmation email to the address provided.`);
  }
}


