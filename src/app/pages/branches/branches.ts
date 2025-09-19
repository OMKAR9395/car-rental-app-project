import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

interface iBranch {
  id: string;          // code, e.g. PNQ
  name: string;        // Pune
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openAt?: string;     // 'HH:mm'
  closeAt?: string;    // 'HH:mm'
  active: boolean;
}

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatButtonModule, MatIconModule, MatTableModule,
    MatTooltipModule, MatDividerModule, MatSnackBarModule, MatChipsModule
  ],
  templateUrl: './branches.html',
  styleUrls: ['./branches.scss']
})
export class Branches {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // demo list
  branches = signal<iBranch[]>([
    { id:'PNQ', name:'Pune',    phone:'020-11112222', email:'pune@demo.com',    city:'Pune',   state:'MH', pincode:'411001', openAt:'09:00', closeAt:'21:00', active:true },
    { id:'BOM', name:'Mumbai',  phone:'022-33334444', email:'mumbai@demo.com',  city:'Mumbai', state:'MH', pincode:'400001', openAt:'08:00', closeAt:'22:00', active:true },
    { id:'NAG', name:'Nagpur',  phone:'0712-5555666', email:'nagpur@demo.com',  city:'Nagpur', state:'MH', pincode:'440001', openAt:'09:00', closeAt:'20:00', active:false },
  ]);

  // search
  q = signal<string>('');
  filtered = computed(() => {
    const s = this.q().toLowerCase().trim();
    return this.branches().filter(b =>
      !s || `${b.id} ${b.name} ${b.city} ${b.state} ${b.phone}`.toLowerCase().includes(s)
    );
  });

  // form
  form = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,6}$/)]], // PNQ, BOM, NAG...
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^[0-9\-+()\s]{6,}$/)]],
    email: ['', [Validators.email]],
    address: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^\d{6}$/)]],
    openAt: ['09:00'],
    closeAt: ['21:00'],
    active: [true]
  });

  editId = signal<string | null>(null);

  // helpers
  onCodeInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const v = (el.value || '').toUpperCase().replace(/\s/g,'');
    el.value = v;
    this.form.patchValue({ id: v });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value as any;

    // unique code check (on create)
    if (!this.editId() && this.branches().some(b => b.id === v.id)) {
      this.snack.open('Branch code already exists', 'OK', { duration: 2000 });
      return;
    }

    if (this.editId()) {
      const id = this.editId()!;
      this.branches.update(list => list.map(b => b.id === id ? ({ ...b, ...v, id }) : b));
      this.snack.open('Branch updated ✅', 'OK', { duration: 1800 });
    } else {
      const row: iBranch = {
        id: v.id, name: v.name, phone: v.phone, email: v.email,
        address: v.address, city: v.city, state: v.state, pincode: v.pincode,
        openAt: v.openAt, closeAt: v.closeAt, active: !!v.active
      };
      this.branches.update(list => [row, ...list]);
      this.snack.open('Branch added ✅', 'OK', { duration: 1800 });
    }
    this.cancelEdit();
  }

  edit(row: iBranch) {
    this.editId.set(row.id);
    this.form.reset({
      id: row.id, name: row.name, phone: row.phone ?? '', email: row.email ?? '',
      address: row.address ?? '', city: row.city ?? '', state: row.state ?? '',
      pincode: row.pincode ?? '', openAt: row.openAt ?? '09:00', closeAt: row.closeAt ?? '21:00',
      active: row.active
    });
  }

  cancelEdit() {
    this.editId.set(null);
    this.form.reset({
      id: '', name: '', phone: '', email: '', address: '',
      city: '', state: '', pincode: '', openAt: '09:00', closeAt: '21:00', active: true
    });
  }

  remove(row: iBranch) {
    if (!confirm(`Delete branch ${row.name} (${row.id})?`)) return;
    this.branches.update(list => list.filter(x => x.id !== row.id));
  }

  toggleActive(row: iBranch) {
    this.branches.update(list => list.map(x => x.id===row.id ? ({ ...x, active: !x.active }) : x));
  }

  exportCsv() {
    const head = ['Code','Name','Phone','Email','City','State','Pincode','OpenAt','CloseAt','Active'];
    const lines = this.branches().map(b => [
      b.id, b.name, b.phone ?? '', b.email ?? '', b.city ?? '', b.state ?? '', b.pincode ?? '',
      b.openAt ?? '', b.closeAt ?? '', b.active ? 'YES' : 'NO'
    ]);
    const csv = [head, ...lines].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'branches.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  onSearch(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  this.q.set(v);
}

}
