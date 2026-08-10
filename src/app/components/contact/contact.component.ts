import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  servicesDropdownOpen = false;
  selectedServices: string[] = [];

  contactForm = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  constructor(private contactService: ContactService) {}

  serviceOptions = [
    { value: 'emc-billing', label: 'Records Retrieval, Billing & Revenue' },
    { value: 'healthcare-rcm', label: 'Healthcare RCM' },
    { value: 'administrative-support', label: 'Administrative Support' },
    { value: 'finance-solutions', label: 'Finance Solutions' },
    { value: 'tech-software', label: 'Tech & Software' },
    { value: 'digital-marketing', label: 'Digital Marketing Solutions' },
    { value: 'legal-process-outsourcing', label: 'Legal Process Outsourcing' }
  ];

  toggleServicesDropdown(): void {
    this.servicesDropdownOpen = !this.servicesDropdownOpen;
  }

  closeServicesDropdown(): void {
    this.servicesDropdownOpen = false;
  }

  toggleService(optionValue: string): void {
    const idx = this.selectedServices.indexOf(optionValue);
    if (idx > -1) {
      this.selectedServices.splice(idx, 1);
    } else {
      this.selectedServices.push(optionValue);
    }
  }

  isServiceSelected(optionValue: string): boolean {
    return this.selectedServices.includes(optionValue);
  }

  getServicesLabel(): string {
    if (this.selectedServices.length === 0) return 'What type of service are you looking for?';
    if (this.selectedServices.length === 1) {
      return this.serviceOptions.find(o => o.value === this.selectedServices[0])?.label || '';
    }
    return `${this.selectedServices.length} services selected`;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    if (this.selectedServices.length === 0) {
      alert('Please select at least one service.');
      return;
    }

    // Validate form inputs
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Map dropdown values to GTM service_name identifiers
    const serviceMap: { [key: string]: string } = {
      'emc-billing': 'copy_services',
      'healthcare-rcm': 'healthcare_rcm',
      'administrative-support': 'administrative_support',
      'finance-solutions': 'finance_solutions',
      'tech-software': 'tech_software',
      'digital-marketing': 'digital_marketing_solutions',
      'legal-process-outsourcing': 'legal_process_outsourcing'
    };

    // Build the list of GTM service names for all selected services
    const gtmServiceNames: string[] = this.selectedServices
      .map(v => serviceMap[v] || v)
      .filter(Boolean);

    // Comma-joined services string for the main GA4 lead event
    const servicesJoined = gtmServiceNames.join(',');

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];

    // 1. Main GA4 Lead Event — includes all selected services as a comma-joined string
    (window as any).dataLayer.push({
      event: 'generate_lead',
      services: servicesJoined,
      form_name: 'service_inquiry',
      page_path: window.location.pathname
    });

    // 2. Service-Specific Lead Events — one push per selected service
    gtmServiceNames.forEach((name: string) => {
      (window as any).dataLayer.push({
        event: 'service_lead',
        service_name: name
      });
    });

    // Human-readable service labels for the Sheet/notification email
    const serviceLabels = this.selectedServices
      .map(v => this.serviceOptions.find(o => o.value === v)?.label)
      .filter((label): label is string => !!label)
      .join(', ');

    this.contactService.submitContact({
      name: this.contactForm.name,
      email: this.contactForm.email,
      phone: this.contactForm.phone,
      services: serviceLabels,
      message: this.contactForm.message
    }).subscribe({
      error: () => {} // fire-and-forget, same pattern as the booking form
    });

    // Reset the form and show success message
    form.reset();
    this.selectedServices = [];
    this.contactForm = { name: '', email: '', phone: '', message: '' };
    alert('Thank you for your message! We will get back to you shortly.');
  }
}



