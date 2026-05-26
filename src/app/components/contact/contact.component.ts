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
  onSubmit(event: Event) {
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

    // Reset the form and show success message
    form.reset();
    alert('Thank you for your message! We will get back to you shortly.');
  }
}



