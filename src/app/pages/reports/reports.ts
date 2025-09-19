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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

type Status = 'confirmed' | 'ongoing' | 'cancelled' | 'completed';
type CarType = 'hatchback' | 'sedan' | 'suv' | 'luxury';

interface Row {
  id: string;
  date: string;          // ISO (pickup date)
  location: 'PNQ' | 'BOM' | 'NAG';
  customer: string;
  car: string;
  type: CarType;
  status: Status;
  days: number;
  dailyPrice: number;    // INR
}

function rangeValidator(group: AbstractControl): ValidationErrors | null {
  const f = group.get('from')?.value as Date | null;
  const t = group.get('to')?.value as Date | null;
  if (!f || !t) return null;
  return t >= f ? null : { badRange: true };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class Reports {
  private fb = inject(FormBuilder);

  // master data
  locations = [
    { code: 'PNQ', name: 'Pune' },
    { code: 'BOM', name: 'Mumbai' },
    { code: 'NAG', name: 'Nagpur' }
  ];

  // mock rows (demo)
  rows = signal<Row[]>([
    { id:'BK-1042', date:'2025-09-18', location:'PNQ', customer:'A. Kulkarni', car:'Honda City',     type:'sedan',     status:'ongoing',   days:2, dailyPrice:2700 },
    { id:'BK-1041', date:'2025-09-17', location:'BOM', customer:'R. Sharma',   car:'Mahindra XUV700',type:'suv',       status:'confirmed', days:3, dailyPrice:4200 },
    { id:'BK-1040', date:'2025-09-16', location:'NAG', customer:'S. Patel',    car:'Maruti Baleno',  type:'hatchback', status:'cancelled', days:1, dailyPrice:1800 },
    { id:'BK-1039', date:'2025-09-12', location:'PNQ', customer:'P. Desai',    car:'Hyundai i20',    type:'hatchback', status:'completed', days:2, dailyPrice:1700 },
    { id:'BK-1038', date:'2025-09-10', location:'BOM', customer:'M. Rao',      car:'Mercedes C-Class',type:'luxury',   status:'completed', days:1, dailyPrice:9500 },
    { id:'BK-1037', date:'2025-09-09', location:'PNQ', customer:'K. Jain',     car:'Tata Nexon EV',  type:'suv',       status:'completed', days:2, dailyPrice:3600 },
  ]);

  // defaults
  private today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  private weekAgo = (() => { const d = new Date(); d.setDate(this.today.getDate()-7); d.setHours(0,0,0,0); return d; })();

  form = this.fb.group({
    from: [this.weekAgo, Validators.required],
    to:   [this.today,    Validators.required],
    locations: [[] as string[]],
    types:     [[] as CarType[]],
    status:    [[] as Status[]],
    q:         ['']
  }, { validators: rangeValidator });

  // derived
  filtered = computed(() => {
    const f = this.form.value;
    const q = (f.q ?? '').toLowerCase().trim();

    return this.rows().filter(r => {
      const d = new Date(r.date);
      const inRange = (!f.from || d >= f.from!) && (!f.to || d <= f.to!);

      const inLoc = !f.locations?.length || f.locations.includes(r.location);
      const inType = !f.types?.length || f.types.includes(r.type);
      const inStatus = !f.status?.length || f.status.includes(r.status);

      const search = !q || `${r.id} ${r.customer} ${r.car}`.toLowerCase().includes(q);

      return inRange && inLoc && inType && inStatus && search;
    });
  });

  totalBookings = computed(() => this.filtered().length);
  totalRevenue  = computed(() =>
    this.filtered().reduce((acc, r) => acc + (r.status !== 'cancelled' ? r.days * r.dailyPrice : 0), 0)
  );
  cancelled     = computed(() => this.filtered().filter(r => r.status === 'cancelled').length);
  avgTicket     = computed(() => this.totalBookings() ? Math.round(this.totalRevenue() / this.totalBookings()) : 0);

  // actions
  reset() {
    this.form.reset({
      from: this.weekAgo, to: this.today,
      locations: [], types: [], status: [], q: ''
    });
  }

  quick(preset: '7d'|'30d'|'month'|'today') {
    const t = new Date(); t.setHours(0,0,0,0);
    let f = new Date(t);
    if (preset === '7d') f.setDate(t.getDate() - 7);
    else if (preset === '30d') f.setDate(t.getDate() - 30);
    else if (preset === 'month') f = new Date(t.getFullYear(), t.getMonth(), 1);
    else f = t;
    this.form.patchValue({ from: f, to: t });
  }

  currency(n: number) { return '₹' + new Intl.NumberFormat('en-IN').format(n); }

  exportCsv() {
    const head = ['Booking ID','Date','Location','Customer','Car','Type','Status','Days','Daily Price','Amount'];
    const lines = this.filtered().map(r => {
      const amt = r.status==='cancelled' ? 0 : r.days * r.dailyPrice;
      return [r.id, r.date, r.location, r.customer, r.car, r.type, r.status, r.days, r.dailyPrice, amt];
    });
    const csv = [head, ...lines].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reports_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
