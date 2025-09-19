import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { MatCardModule }    from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }   from '@angular/material/input';
import { MatSelectModule }  from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule }   from '@angular/material/radio';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule }   from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

interface iCustomer {
  id: string;
  type: 'individual' | 'corporate';
  name: string;
  phone: string;
  email?: string;
  dob: Date | null;
  kycType: 'aadhaar' | 'passport' | 'pan' | 'dl';
  kycNumber: string;
  dlNumber?: string;
  dlExpiry?: Date | null;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/* ── Validators ────────────────────────────────────────────────────────── */
function adultValidator(ctrl: AbstractControl): ValidationErrors | null {
  const dob = ctrl.get('dob')?.value as Date | null;
  if (!dob) return null;
  const today = new Date();
  const hadBirthday =
    today >= new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  const age = today.getFullYear() - dob.getFullYear() - (hadBirthday ? 0 : 1);
  return age >= 18 ? null : { underage: true };
}

function expiryAfterToday(ctrl: AbstractControl): ValidationErrors | null {
  const exp = ctrl.get('dlExpiry')?.value as Date | null;
  if (!exp) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const e = new Date(exp);  e.setHours(0,0,0,0);
  return e > today ? null : { pastExpiry: true };
}

/* ── Customer (standalone) ─────────────────────────────────────────────── */
@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatRadioModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatTableModule, MatDividerModule
  ],
  templateUrl: './customer.html',
  styleUrls: ['./customer.scss']
})
export class Customer {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // dates
  today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  minDob = new Date(1900, 0, 1);
  maxDob = this.today;

  // form
  form = this.fb.group({
    type: ['individual', Validators.required],
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: ['', [Validators.email]],
    dob: [null as Date | null, Validators.required],

    kycType: ['aadhaar', Validators.required],
    kycNumber: ['', [Validators.required, Validators.minLength(6)]],

    dlNumber: [''],
    dlExpiry: [null as Date | null],

    address: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^\d{6}$/)]],
  }, { validators: [adultValidator, expiryAfterToday] });

  // in-memory list
  customers = signal<iCustomer[]>([]);
  displayed = ['id', 'name', 'phone', 'kyc', 'city', 'actions'];

  private seq = 1000;
  private nextId() { this.seq += 1; return `CUS-${this.seq}`; }

  // helpers
  has(ctrl: string, err: string) {
    const c = this.form.get(ctrl);
    return !!c && (c.touched || c.dirty) && c.hasError(err);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('underage'))   this.snack.open('Customer must be 18+ years', 'OK', { duration: 2200 });
      if (this.form.hasError('pastExpiry')) this.snack.open('License expiry must be in the future', 'OK', { duration: 2200 });
      return;
    }
    const v = this.form.value as any;
    const row: iCustomer = {
      id: this.nextId(),
      type: v.type, name: v.name, phone: v.phone, email: v.email,
      dob: v.dob, kycType: v.kycType, kycNumber: v.kycNumber,
      dlNumber: v.dlNumber, dlExpiry: v.dlExpiry,
      address: v.address, city: v.city, state: v.state, pincode: v.pincode
    };
    this.customers.update(list => [row, ...list]);
    this.snack.open('Customer saved ✅', 'OK', { duration: 2000 });
    this.form.reset({ type: 'individual', kycType: 'aadhaar' });
  }

  resetAll() {
    this.form.reset({ type: 'individual', kycType: 'aadhaar' });
  }

  remove(row: iCustomer) {
    this.customers.update(list => list.filter(x => x.id !== row.id));
  }

  kycLabel(t: iCustomer['kycType']) {
    return t === 'aadhaar' ? 'Aadhaar'
         : t === 'passport' ? 'Passport'
         : t === 'pan'      ? 'PAN'
         : 'DL';
  }
}
