import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { Validators, AbstractControl, ValidationErrors } from '@angular/forms';

type Status = 'pending' | 'approved' | 'ongoing' | 'completed' | 'cancelled';
type CarType = 'hatchback' | 'sedan' | 'suv' | 'luxury';

interface Row {
  id: string;
  pickAt: string;       // ISO
  dropAt: string;       // ISO
  location: 'PNQ'|'BOM'|'NAG';
  customer: string;
  car: string;
  type: CarType;
  status: Status;
  days: number;
  dailyPrice: number;
  cancelReason?: string;
}

// date-range validator (filters)
function rangeValidator(group: AbstractControl): ValidationErrors | null {
  const f = group.get('from')?.value as Date | null;
  const t = group.get('to')?.value as Date | null;
  if (!f || !t) return null;
  return t >= f ? null : { badRange: true };
}

/* ---------------- Cancel Reason Dialog ---------------- */
@Component({
  selector: 'app-cancel-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Cancel booking</h2>
    <form class="p-3" [formGroup]="form">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Reason</mat-label>
        <textarea matInput rows="3" formControlName="reason" placeholder="e.g. Customer requested"></textarea>
        <mat-error *ngIf="form.invalid">Reason is required</mat-error>
      </mat-form-field>
      <div class="d-flex gap-2 justify-end mt-2">
        <button mat-button mat-dialog-close>Close</button>
        <button mat-raised-button color="warn" [disabled]="form.invalid" [mat-dialog-close]="form.value.reason">Cancel booking</button>
      </div>
    </form>
  `,
  styles: [`.w-100{width:100%}.p-3{padding:12px}.gap-2{gap:8px}.justify-end{justify-content:flex-end}.mt-2{margin-top:8px}`]
})
export class CancelDialog {
  private fb = inject(FormBuilder);
  form = this.fb.group({ reason: ['', Validators.required] });
}

/* ---------------- Main: Bookings Management ---------------- */
@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatTableModule, MatCheckboxModule,
    MatMenuModule, MatChipsModule, MatTooltipModule, MatDialogModule, MatDividerModule
  ],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss']
})
export class Bookings {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // demo rows
  rows = signal<Row[]>([
    { id:'BK-1045', pickAt:'2025-09-19T10:00:00', dropAt:'2025-09-21T10:00:00', location:'PNQ', customer:'A. Kulkarni', car:'Honda City', type:'sedan', status:'pending',   days:2, dailyPrice:2700 },
    { id:'BK-1044', pickAt:'2025-09-18T09:00:00', dropAt:'2025-09-19T09:00:00', location:'BOM', customer:'R. Sharma',   car:'XUV700',     type:'suv',   status:'approved', days:1, dailyPrice:4200 },
    { id:'BK-1043', pickAt:'2025-09-17T12:00:00', dropAt:'2025-09-20T12:00:00', location:'NAG', customer:'S. Patel',    car:'Baleno',     type:'hatchback', status:'ongoing',  days:3, dailyPrice:1800 },
    { id:'BK-1042', pickAt:'2025-09-12T10:00:00', dropAt:'2025-09-14T10:00:00', location:'PNQ', customer:'P. Desai',    car:'Hyundai i20',type:'hatchback', status:'completed',days:2, dailyPrice:1700 },
    { id:'BK-1041', pickAt:'2025-09-10T10:00:00', dropAt:'2025-09-10T18:00:00', location:'BOM', customer:'M. Rao',      car:'Mercedes C', type:'luxury',   status:'cancelled',days:1, dailyPrice:9500, cancelReason:'Payment not received' },
  ]);

  // selection
  selected = signal<Set<string>>(new Set());
  toggleRow(id: string, checked: boolean) {
    const copy = new Set(this.selected());
    checked ? copy.add(id) : copy.delete(id);
    this.selected.set(copy);
  }
  toggleAll(checked: boolean, ids: string[]) {
    const copy = new Set(this.selected());
    if (checked) ids.forEach(id => copy.add(id)); else ids.forEach(id => copy.delete(id));
    this.selected.set(copy);
  }

  // filters
  private today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  private weekAgo = (() => { const d = new Date(); d.setDate(this.today.getDate()-7); d.setHours(0,0,0,0); return d; })();

  form = this.fb.group({
    from: [this.weekAgo],
    to:   [this.today],
    status: [[] as Status[]],
    types:  [[] as CarType[]],
    locations: [[] as string[]],
    q: ['']
  }, { validators: rangeValidator });

  // derived
  filtered = computed(() => {
    const f = this.form.value;
    const q = (f.q ?? '').toLowerCase().trim();
    return this.rows().filter(r => {
      const d = new Date(r.pickAt);
      const inRange   = (!f.from || d >= f.from!) && (!f.to || d <= f.to!);
      const inStatus  = !f.status?.length || f.status.includes(r.status);
      const inType    = !f.types?.length || f.types.includes(r.type);
      const inLoc     = !f.locations?.length || f.locations.includes(r.location);
      const inSearch  = !q || `${r.id} ${r.customer} ${r.car}`.toLowerCase().includes(q);
      return inRange && inStatus && inType && inLoc && inSearch;
    });
  });

  ids = computed(() => this.filtered().map(r => r.id));
  allChecked = computed(() => this.ids().every(id => this.selected().has(id)) && this.ids().length>0);
  someChecked = computed(() => !this.allChecked() && this.ids().some(id => this.selected().has(id)));

  // helpers
  currency(n: number) { return '₹' + new Intl.NumberFormat('en-IN').format(n); }
  amount(r: Row) { return r.status === 'cancelled' ? 0 : r.days * r.dailyPrice; }
  chipColor(s: Status) {
    return s==='pending' ? 'default' : s==='approved' ? 'accent' : s==='ongoing' ? 'primary' : s==='completed' ? 'success' : 'warn';
  }

  // actions on single row
  approve(r: Row)  { if (r.status==='pending')  this.patch(r.id, { status:'approved' }); }
  start(r: Row)    { if (r.status==='approved') this.patch(r.id, { status:'ongoing' }); }
  complete(r: Row) { if (r.status==='ongoing')  this.patch(r.id, { status:'completed' }); }
  async cancel(r: Row) {
    const reason = await this.dialog.open(CancelDialog).afterClosed().toPromise();
    if (!reason) return;
    this.patch(r.id, { status:'cancelled', cancelReason: reason });
  }

  // bulk
  bulkCancel() {
    this.dialog.open(CancelDialog).afterClosed().subscribe(reason => {
      if (!reason) return;
      const ids = Array.from(this.selected());
      this.rows.update(list =>
        list.map(r => ids.includes(r.id) ? { ...r, status:'cancelled', cancelReason: reason } : r)
      );
      this.selected.set(new Set());
    });
  }
  bulkApprove() {
    const ids = Array.from(this.selected());
    this.rows.update(list => list.map(r => ids.includes(r.id) && r.status==='pending' ? { ...r, status:'approved' } : r));
    this.selected.set(new Set());
  }

  // tiny state patcher
  private patch(id: string, partial: Partial<Row>) {
    this.rows.update(list => list.map(r => r.id===id ? ({ ...r, ...partial }) : r));
  }

  // quick ranges
  quick(preset: 'today'|'7d'|'30d'|'month') {
    const t = new Date(); t.setHours(0,0,0,0);
    let f = new Date(t);
    if (preset==='today') f = t;
    else if (preset==='7d') f.setDate(t.getDate()-7);
    else if (preset==='30d') f.setDate(t.getDate()-30);
    else f = new Date(t.getFullYear(), t.getMonth(), 1);
    this.form.patchValue({ from: f, to: t });
  }

  exportCsv() {
    const head = ['ID','Pickup','Drop','Loc','Customer','Car','Type','Status','Days','DailyPrice','Amount','CancelReason'];
    const lines = this.filtered().map(r => [
      r.id, new Date(r.pickAt).toISOString(), new Date(r.dropAt).toISOString(), r.location, r.customer, r.car, r.type,
      r.status, r.days, r.dailyPrice, this.amount(r), r.cancelReason ?? ''
    ]);
    const csv = [head, ...lines].map(x => x.join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bookings.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
