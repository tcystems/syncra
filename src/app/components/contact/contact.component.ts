import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  servicesDropdownOpen = false;
  selectedServices: string[] = [];

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

    const selectedValue = this.selectedServices[0];

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

    // Reset the form and show success message
    form.reset();
    this.selectedServices = [];
    alert('Thank you for your message! We will get back to you shortly.');
  }
}



