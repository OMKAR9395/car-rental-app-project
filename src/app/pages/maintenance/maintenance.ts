import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type MaintType = 'service' | 'repair' | 'insurance' | 'puc' | 'other';

interface iCar { id: string; brand: string; model: string; }
interface iMaintenance {
  id: string;
  carId: string;
  type: MaintType;
  from: Date;
  to: Date;
  days: number;
  notes?: string;
}

/* date range validator */
function rangeValidator(group: AbstractControl): ValidationErrors | null {
  const f = group.get('from')?.value as Date | null;
  const t = group.get('to')?.value as Date | null;
  if (!f || !t) return null;
  return t >= f ? null : { badRange: true };
}

/* overlap helper */
function overlaps(aFrom: Date, aTo: Date, bFrom: Date, bTo: Date) {
  return aFrom <= bTo && bFrom <= aTo;
}

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatTooltipModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './maintenance.html',
  styleUrls: ['./maintenance.scss']
})
export class Maintenance {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // demo cars (ids Car Master शी match)
  cars = signal<iCar[]>([
    { id:'CAR-1001', brand:'Honda',    model:'City' },
    { id:'CAR-1002', brand:'Mahindra', model:'XUV700' },
    { id:'CAR-1003', brand:'Maruti',   model:'Baleno' },
  ]);

  // records
  items = signal<iMaintenance[]>([
    { id:'MT-1003', carId:'CAR-1001', type:'service',  from:new Date('2025-09-22'), to:new Date('2025-09-23'), days:2, notes:'60k km service' },
    { id:'MT-1002', carId:'CAR-1002', type:'insurance',from:new Date('2025-09-28'), to:new Date('2025-09-28'), days:1, notes:'Policy renewal' },
    { id:'MT-1001', carId:'CAR-1003', type:'puc',      from:new Date('2025-09-25'), to:new Date('2025-09-25'), days:1, notes:'PUC check' },
  ]);

  // filters
  f = this.fb.group({
    carId: [''],
    types: [[] as MaintType[]],
    from: [null as Date | null],
    to: [null as Date | null],
    q: ['']
  }, { validators: rangeValidator });

  // add/edit form
  form = this.fb.group({
    carId: ['', Validators.required],
    type: ['service' as MaintType, Validators.required],
    from: [null as Date | null, Validators.required],
    to:   [null as Date | null, Validators.required],
    notes: ['']
  }, { validators: rangeValidator });

  // derived
  filtered = computed(() => {
    const v = this.f.value;
    const q = (v.q ?? '').toLowerCase().trim();
    return this.items().filter(r => {
      const inCar = !v.carId || r.carId === v.carId;
      const inType = !v.types?.length || v.types.includes(r.type);
      const inRange =
        (!v.from || r.to >= v.from!) && (!v.to || r.from <= v.to!);
      const carName = this.carName(r.carId).toLowerCase();
      const search = !q || `${r.id} ${carName} ${r.type} ${r.notes ?? ''}`.toLowerCase().includes(q);
      return inCar && inType && inRange && search;
    });
  });

  // overlap indicator for current input
  get clash(): string | null {
    const v = this.form.value as any;
    if (!v.carId || !v.from || !v.to) return null;
    const hit = this.items().find(x => x.carId === v.carId && overlaps(v.from, v.to, x.from, x.to));
    return hit ? hit.id : null;
  }

  // id maker
  private seq = 1003;
  private nextId() { this.seq += 1; return `MT-${this.seq}`; }

  // helpers
  carName(id: string) {
    const c = this.cars().find(x => x.id === id);
    return c ? `${c.brand} ${c.model}` : id;
  }
  daysBetween(a: Date, b: Date) {
    const A = new Date(a); const B = new Date(b);
    A.setHours(0,0,0,0); B.setHours(0,0,0,0);
    return Math.max(1, Math.round((Number(B)-Number(A)) / 86400000) + 1);
  }
  onSearch(e: Event) { this.f.patchValue({ q: (e.target as HTMLInputElement).value }); }

  // actions
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.clash) {
      this.snack.open(`Overlaps with ${this.clash} — adjust dates`, 'OK', { duration: 2500 });
      return;
    }
    const v = this.form.value as any;
    const row: iMaintenance = {
      id: this.nextId(),
      carId: v.carId,
      type: v.type,
      from: v.from,
      to: v.to,
      days: this.daysBetween(v.from, v.to),
      notes: v.notes
    };
    this.items.update(list => [row, ...list]);
    this.snack.open('Block added ✅', 'OK', { duration: 1800 });
    this.reset();
  }

  reset() {
    this.form.reset({ carId:'', type:'service', from:null, to:null, notes:'' });
  }

  remove(r: iMaintenance) {
    if (!confirm(`Delete block ${r.id} for ${this.carName(r.carId)}?`)) return;
    this.items.update(list => list.filter(x => x.id !== r.id));
  }

  exportCsv() {
    const head = ['ID','Car','Type','From','To','Days','Notes'];
    const lines = this.filtered().map(r => [
      r.id, this.carName(r.carId), r.type, r.from.toISOString().slice(0,10),
      r.to.toISOString().slice(0,10), r.days, (r.notes ?? '').replace(/[\r\n,]/g,' ')
    ]);
    const csv = [head, ...lines].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'maintenance.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
