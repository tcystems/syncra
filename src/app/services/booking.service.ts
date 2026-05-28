import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookingPayload {
  formName: string;   // 'Syncra Demo' | 'Claude MD' | 'Cyclone RCM' | 'Sumxio'
  date: string;       // 'YYYY-MM-DD'
  timezone: string;   // 'ET' | 'CT' | 'MT' | 'PT' | 'AKT' | 'HT'
  timeSlot: string;   // raw label, e.g. '9:00 AM – 10:00 AM'
  services: string;   // comma-separated services or product name
  company: string;
  email: string;
  phone: string;
}

export interface BookedSlotsResponse {
  date: string;
  bookedSlots: string[];  // raw labels without timezone, e.g. ['9:00 AM – 10:00 AM']
}

@Injectable({ providedIn: 'root' })
export class BookingService {

  /**
   * IMPORTANT: Replace this placeholder with your deployed Apps Script Web App URL.
   * After deploying (see syncra-bookings-gas.gs setup instructions), copy the
   * Web App URL from Apps Script → Deploy → Manage deployments and paste it here.
   */
  private readonly GAS_URL = 'https://script.google.com/macros/s/AKfycbz4jeR8j_S_jiN4tNQfDY8rIP8blMap4Tywtq0hS9q2_-HLu1W_srvvfmLoqNFXIYosBQ/exec';

  constructor(private http: HttpClient) {}

  /**
   * Fetches booked slot labels for a given date and requested timezone.
   * GAS does the math to shift booked times into the requested timezone.
   */
  getBookedSlots(date: string, timezone: string): Observable<BookedSlotsResponse> {
    const params = new HttpParams()
      .set('action', 'getSlots')
      .set('date', date)
      .set('timezone', timezone);
    return this.http.get<BookedSlotsResponse>(this.GAS_URL, { params });
  }

  /**
   * Submits a booking to Google Apps Script.
   * Uses fetch() with mode: 'no-cors' + URLSearchParams body to avoid CORS preflight.
   * The request always resolves (opaque response), so success is optimistic.
   * GAS processes the data server-side: appends to Sheet + sends email.
   */
  submitBooking(payload: BookingPayload): Observable<void> {
    return new Observable(observer => {
      const formData = new URLSearchParams();
      (Object.keys(payload) as (keyof BookingPayload)[]).forEach(key => {
        formData.set(key, payload[key]);
      });

      fetch(this.GAS_URL, {
        method: 'POST',
        mode: 'no-cors',   // Opaque — avoids CORS preflight; GAS receives and processes it
        body: formData,    // URLSearchParams auto-sets Content-Type: application/x-www-form-urlencoded
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
