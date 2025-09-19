import { Component, inject, signal } from '@angular/core';
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

type CarType = 'hatchback' | 'sedan' | 'suv' | 'luxury';
type FuelType = 'petrol' | 'diesel' | 'ev' | 'hybrid';
type TransType = 'manual' | 'automatic';

interface iCar {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  fuel: FuelType;
  transmission: TransType;
  seats: number;
  dailyPrice: number;
  regNo?: string;
  odometer?: number;
  branchId?: string;
  imageUrls?: string[];
  active: boolean;
}

@Component({
  selector: 'app-car-master',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSliderModule,
    MatSlideToggleModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatTooltipModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './car-master.html',
  styleUrls: ['./car-master.scss']
})
export class CarMaster {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // master lists
  brands = ['Maruti', 'Hyundai', 'Honda', 'Tata', 'Mahindra', 'Toyota', 'Kia', 'Skoda', 'Volkswagen', 'Mercedes'];
  modelsByBrand: Record<string, string[]> = {
    Maruti: ['Baleno', 'Swift', 'Dzire'],
    Hyundai: ['i20', 'Creta', 'Verna'],
    Honda: ['City', 'Amaze', 'Elevate'],
    Tata: ['Nexon', 'Altroz', 'Harrier'],
    Mahindra: ['XUV700', 'Scorpio-N', 'Thar'],
    Toyota: ['Glanza', 'Innova', 'Fortuner'],
    Kia: ['Seltos', 'Sonet', 'Carens'],
    Skoda: ['Slavia', 'Kushaq'],
    Volkswagen: ['Virtus', 'Taigun'],
    Mercedes: ['C-Class', 'E-Class', 'GLA']
  };
  branches = [
    { id: 'PNQ', name: 'Pune' },
    { id: 'BOM', name: 'Mumbai' },
    { id: 'NAG', name: 'Nagpur' }
  ];

  // list (demo data)
  cars = signal<iCar[]>([
    { id:'CAR-1001', brand:'Honda', model:'City', type:'sedan', fuel:'petrol', transmission:'manual', seats:5, dailyPrice:2700, regNo:'MH12-AB-1234', odometer:42000, branchId:'PNQ', imageUrls:['assets/cars/city.jpg'], active:true },
    { id:'CAR-1002', brand:'Mahindra', model:'XUV700', type:'suv', fuel:'diesel', transmission:'automatic', seats:7, dailyPrice:4200, regNo:'MH01-CD-4321', odometer:28000, branchId:'BOM', imageUrls:['assets/cars/xuv700.jpg'], active:true },
    { id:'CAR-1003', brand:'Maruti', model:'Baleno', type:'hatchback', fuel:'petrol', transmission:'manual', seats:5, dailyPrice:1800, regNo:'MH31-EF-9876', odometer:36000, branchId:'NAG', imageUrls:['assets/cars/baleno.jpg'], active:false }
  ]);

  // form + state
  form = this.fb.group({
    brand: ['', Validators.required],
    model: ['', Validators.required],
    type: ['sedan' as CarType, Validators.required],
    fuel: ['petrol' as FuelType, Validators.required],
    transmission: ['manual' as TransType, Validators.required],
    seats: [5, [Validators.required, Validators.min(2), Validators.max(8)]],
    dailyPrice: [2000, [Validators.required, Validators.min(300)]],
    regNo: ['', [Validators.pattern(/^[A-Z]{2}\s?-?\d{2}\s?-?[A-Z]{1,2}\s?-?\d{4}$/)]], // MH12-AB-1234 (hyphens/spaces optional)
    odometer: [0, [Validators.min(0)]],
    branchId: ['PNQ', Validators.required],
    active: [true]
  });

  editId = signal<string | null>(null);
  previews = signal<string[]>([]); // local preview URLs for upload

  // id generator
  private seq = 1003;
  private nextId() { this.seq += 1; return `CAR-${this.seq}`; }

  // helpers
  get models(): string[] {
    const b = this.form.value.brand || '';
    return this.modelsByBrand[b] ?? [];
  }
  currency(n: number) { return '₹' + new Intl.NumberFormat('en-IN').format(n); }

  // slider handlers (Material v15+ syntax)
  onSeatsInput(ev: Event) {
    const v = Number((ev.target as HTMLInputElement)?.value ?? 5);
    this.form.patchValue({ seats: v });
  }

  // image upload
  onImagesSelected(ev: Event) {
    const files = (ev.target as HTMLInputElement)?.files;
    if (!files || files.length === 0) return;
    const urls: string[] = [];
    Array.from(files).forEach(f => urls.push(URL.createObjectURL(f)));
    this.previews.set(urls);
  }

  clearImages() {
    this.previews.set([]);
    const input = document.getElementById('carImages') as HTMLInputElement | null;
    if (input) input.value = '';
  }

  // CRUD
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value as any;

    if (this.editId()) {
      // update
      const id = this.editId()!;
      this.cars.update(list => list.map(c => c.id === id ? ({
        ...c,
        ...v,
        imageUrls: this.previews().length ? this.previews() : c.imageUrls
      }) : c));
      this.snack.open('Car updated ✅', 'OK', { duration: 1800 });
    } else {
      // add
      const row: iCar = {
        id: this.nextId(),
        brand: v.brand, model: v.model, type: v.type, fuel: v.fuel,
        transmission: v.transmission, seats: v.seats, dailyPrice: v.dailyPrice,
        regNo: v.regNo, odometer: v.odometer, branchId: v.branchId,
        imageUrls: this.previews(), active: !!v.active
      };
      this.cars.update(list => [row, ...list]);
      this.snack.open('Car added ✅', 'OK', { duration: 1800 });
    }
    this.cancelEdit(); // reset
  }

  edit(row: iCar) {
    this.editId.set(row.id);
    this.form.reset({
      brand: row.brand, model: row.model, type: row.type, fuel: row.fuel,
      transmission: row.transmission, seats: row.seats, dailyPrice: row.dailyPrice,
      regNo: row.regNo ?? '', odometer: row.odometer ?? 0, branchId: row.branchId ?? 'PNQ',
      active: row.active
    });
    this.previews.set(row.imageUrls ?? []);
  }

  cancelEdit() {
    this.editId.set(null);
    this.form.reset({
      brand: '', model: '', type: 'sedan', fuel: 'petrol',
      transmission: 'manual', seats: 5, dailyPrice: 2000,
      regNo: '', odometer: 0, branchId: 'PNQ', active: true
    });
    this.clearImages();
  }

  remove(row: iCar) {
    if (!confirm(`Delete ${row.brand} ${row.model}?`)) return;
    this.cars.update(list => list.filter(x => x.id !== row.id));
  }

  toggleActive(row: iCar) {
    this.cars.update(list => list.map(x => x.id === row.id ? ({ ...x, active: !x.active }) : x));
  }

  // export
  exportCsv() {
    const head = ['ID','Brand','Model','Type','Fuel','Trans','Seats','DailyPrice','RegNo','Odometer','Branch','Active'];
    const lines = this.cars().map(c => [
      c.id, c.brand, c.model, c.type, c.fuel, c.transmission, c.seats, c.dailyPrice, c.regNo ?? '', c.odometer ?? 0, c.branchId ?? '', c.active ? 'YES' : 'NO'
    ]);
    const csv = [head, ...lines].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cars_master.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
