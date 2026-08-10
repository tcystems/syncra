import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  services: string;   // comma-separated service labels
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {

  /**
   * IMPORTANT: Replace this placeholder with the deployed Apps Script Web App URL
   * for syncra-contact-gas.gs (a standalone script, separate from the booking one).
   * Deploy that script, then copy its Web App URL here.
   */
  private readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbx68o3YQAZFOlJQJ4SShI3O4Q1fHuPzs6WW8ugUVqHmaOuHpB-jaGqN4mcw7nZM65ci/exec';

  /**
   * Submits the "Get in Touch" contact form to Google Apps Script.
   * Uses fetch() with mode: 'no-cors' + URLSearchParams body to avoid CORS preflight.
   * The request always resolves (opaque response), so success is optimistic.
   * GAS appends the data to a "Contact Data" sheet tab and sends a team-only
   * notification email (no confirmation email to the submitter).
   */
  submitContact(payload: ContactPayload): Observable<void> {
    return new Observable(observer => {
      const formData = new URLSearchParams();
      (Object.keys(payload) as (keyof ContactPayload)[]).forEach(key => {
        formData.set(key, payload[key]);
      });

      fetch(this.GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      })
      .then(() => {
        observer.next();
        observer.complete();
      })
      .catch(err => {
        observer.error(err);
      });
    });
  }
}
