import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type Sev = 'minor'|'moderate'|'major';

interface iCar { id: string; brand: string; model: string; }
interface iDamage {
  id: string;
  part: string;
  severity: Sev;
  estCost: number;
  notes?: string;
  photos?: string[]; // preview URLs
}

@Component({
  selector: 'app-return-inspection',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSliderModule, MatSlideToggleModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatTooltipModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './return-inspection.html',
  styleUrls: ['./return-inspection.scss']
})
export class ReturnInspection {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // demo cars (ids Car Master शी sync ठेवा)
  cars = signal<iCar[]>([
    { id:'CAR-1001', brand:'Honda',    model:'City' },
    { id:'CAR-1002', brand:'Mahindra', model:'XUV700' },
    { id:'CAR-1003', brand:'Maruti',   model:'Baleno' },
  ]);

  // policy (demo)
  readonly FUEL_RATE_PER_PERCENT = 30;  // ₹ per 1% shortage
  readonly CLEANING_FEE = 500;          // if cleaningRequired
  readonly LATE_FEE_DEFAULT = 200;      // ₹/hour

  // main form
  form = this.fb.group({
    bookingId: ['', [Validators.required, Validators.minLength(4)]],
    carId: ['', Validators.required],
    odometer: [0, [Validators.required, Validators.min(0)]],
    fuel: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    cleaningRequired: [false],
    lateHours: [0, [Validators.min(0)]],
    lateFeePerHour: [200, [Validators.min(0)]],
    deposit: [5000, [Validators.min(0)]],
    notes: ['']
  });

  // damages
  damages = signal<iDamage[]>([]);
  displayed = ['part','severity','cost','photos','notes','actions'];

  // add-damage mini form state
  dForm = this.fb.group({
    part: ['', Validators.required],
    severity: ['minor' as Sev, Validators.required],
    estCost: [0, [Validators.required, Validators.min(0)]],
    notes: ['']
  });
  dPreviews = signal<string[]>([]);

  // totals
  totalDamage = computed(() => this.damages().reduce((s,d)=> s + (d.estCost||0), 0));
  fuelCharge = computed(() => {
    const v = this.form.value.fuel ?? 100;
    const shortage = Math.max(0, 100 - Number(v));
    return shortage * this.FUEL_RATE_PER_PERCENT;
  });
  cleaningCharge = computed(() => this.form.value.cleaningRequired ? this.CLEANING_FEE : 0);
  lateFee = computed(() => (this.form.value.lateHours||0) * (this.form.value.lateFeePerHour||this.LATE_FEE_DEFAULT));
  subTotal = computed(() => this.totalDamage() + this.fuelCharge() + this.cleaningCharge() + this.lateFee());
  deposit = computed(() => Number(this.form.value.deposit || 0));
  netPayable = computed(() => Math.max(0, this.subTotal() - this.deposit()));
  refund = computed(() => Math.max(0, this.deposit() - this.subTotal()));

  // helpers
  carName(id: string) {
    const c = this.cars().find(x => x.id === id);
    return c ? `${c.brand} ${c.model}` : id;
  }
  currency(n: number) { return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n)); }

  // slider (Angular v17+)
  onFuelInput(ev: Event) {
    const v = Number((ev.target as HTMLInputElement).value || 0);
    this.form.patchValue({ fuel: v });
  }

  // damage photos
  onDamagePhotos(ev: Event) {
    const files = (ev.target as HTMLInputElement)?.files;
    if (!files || !files.length) return;
    const urls: string[] = [];
    Array.from(files).forEach(f => urls.push(URL.createObjectURL(f)));
    this.dPreviews.set(urls);
  }
  clearDamagePhotos() {
    this.dPreviews.set([]);
    const el = document.getElementById('damagePhotos') as HTMLInputElement | null;
    if (el) el.value = '';
  }

  addDamage() {
    if (this.dForm.invalid) { this.dForm.markAllAsTouched(); return; }
    const v = this.dForm.value as any;
    const row: iDamage = {
      id: 'DMG-' + (Date.now()%1e6),
      part: v.part, severity: v.severity, estCost: Number(v.estCost||0), notes: v.notes || '',
      photos: this.dPreviews()
    };
    this.damages.update(list => [row, ...list]);
    this.dForm.reset({ part:'', severity:'minor', estCost:0, notes:'' });
    this.clearDamagePhotos();
  }

  removeDamage(row: iDamage) {
    this.damages.update(list => list.filter(x => x.id !== row.id));
  }

  // save (demo)
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = {
      ...this.form.value,
      damages: this.damages(),
      totals: {
        totalDamage: this.totalDamage(),
        fuelCharge: this.fuelCharge(),
        cleaningCharge: this.cleaningCharge(),
        lateFee: this.lateFee(),
        subTotal: this.subTotal(),
        deposit: this.deposit(),
        netPayable: this.netPayable(),
        refund: this.refund()
      }
    };
    console.log('RETURN INSPECTION =>', payload);
    this.snack.open('Inspection saved ✅', 'OK', { duration: 1800 });
    this.resetAll();
  }

  resetAll() {
    this.form.reset({
      bookingId:'', carId:'', odometer:0, fuel:100,
      cleaningRequired:false, lateHours:0, lateFeePerHour:this.LATE_FEE_DEFAULT, deposit:5000, notes:''
    });
    this.damages.set([]);
    this.clearDamagePhotos();
  }

  exportCsv() {
    const head = ['Booking','Car','Odometer','Fuel%','Cleaning','LateHours','LateFee/Hr','Deposit','TotalDamage','FuelCharge','CleaningCharge','LateFee','SubTotal','NetPayable','Refund'];
    const v = this.form.value;
    const line = [
      v.bookingId || '', this.carName(v.carId || ''), v.odometer || 0, v.fuel || 0,
      v.cleaningRequired ? 'YES':'NO', v.lateHours || 0, v.lateFeePerHour || 0, v.deposit || 0,
      this.totalDamage(), this.fuelCharge(), this.cleaningCharge(), this.lateFee(), this.subTotal(), this.netPayable(), this.refund()
    ];
    // damages flattened
    const dmgHead = ['#','Part','Severity','EstCost','Notes'];
    const dmgLines = this.damages().map((d,i)=> [i+1, d.part, d.severity, d.estCost, (d.notes||'').replace(/[\r\n,]/g,' ')]);
    const csv = [
      head.join(','), line.join(','),
      '', 'Damages:', dmgHead.join(','), ...dmgLines.map(r=>r.join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `return_inspection_${v.bookingId || 'draft'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
