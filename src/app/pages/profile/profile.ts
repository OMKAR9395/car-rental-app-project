import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

function passwordGroupValidator(ctrl: AbstractControl): ValidationErrors | null {
  const cur = (ctrl.get('current')?.value ?? '').toString();
  const next = (ctrl.get('next')?.value ?? '').toString();
  const conf = (ctrl.get('confirm')?.value ?? '').toString();

  // जर तिन्ही रिकामे असतील तर validation नाही (optional section)
  if (!cur && !next && !conf) return null;

  const errs: any = {};
  if (!cur) errs.currentRequired = true;
  if (!next || next.length < 6) errs.nextWeak = true;
  if (next !== conf) errs.mismatch = true;

  return Object.keys(errs).length ? errs : null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatDividerModule, MatSnackBarModule,FormsModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // avatar preview
  avatarUrl = signal<string>('assets/avatar/default.png');

  // dates
  today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  minDob = new Date(1900, 0, 1);
  maxDob = this.today;

  form = this.fb.group({
    // basic
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    gender: [''],
    dob: [null as Date | null],

    // address
    address: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^\d{6}$/)]],

    // preferences
    notifEmail: [true],
    notifSms: [false],
    notifWhatsApp: [false],

    // optional password change (group)
    password: this.fb.group({
      current: [''],
      next: [''],
      confirm: ['']
    }, { validators: passwordGroupValidator })
  });

  // helpers
  has(ctrl: string, err: string) {
    const c = this.form.get(ctrl);
    return !!c && (c.touched || c.dirty) && c.hasError(err);
  }
  passHas(err: string) {
    const g = this.form.get('password');
    return !!g && (g.touched || g.dirty) && g.hasError(err);
  }

  // avatar upload
  onAvatarChange(ev: Event) {
    const file = (ev.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.avatarUrl.set(url);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.get('password')?.errors?.['mismatch']) {
        this.snack.open('New password & confirm must match', 'OK', { duration: 2200 });
      } else if (this.form.get('password')?.errors?.['nextWeak']) {
        this.snack.open('New password must be at least 6 characters', 'OK', { duration: 2200 });
      }
      return;
    }
    const payload = this.form.value;
    console.log('PROFILE =>', payload);
    this.snack.open('Profile updated ✅', 'OK', { duration: 2000 });
  }

  resetAll() {
    this.form.reset({
      notifEmail: true,
      notifSms: false,
      notifWhatsApp: false
    });
  }
}
