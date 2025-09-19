import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type CarType = 'hatchback' | 'sedan' | 'suv' | 'luxury';
type Transmission = 'manual' | 'automatic';
type Fuel = 'petrol' | 'diesel' | 'ev' | 'hybrid';

interface Car {
  id: string;
  brand: string;
  model: string;
  type: CarType;
  seats: number;
  transmission: Transmission;
  fuel: Fuel;
  dailyPrice: number; // INR
  rating: number;     // 1..5 (float ok)
  imageUrl?: string;
  locations: string[]; // location codes
}

@Component({
  selector: 'app-cars',
  imports: [CommonModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatSliderModule, MatTooltipModule, MatPaginatorModule, FormsModule],
  templateUrl: './cars.html',
  styleUrl: './cars.scss'
})
export class Cars {
  router = inject(Router);
  // ---------- Mock Master Data ----------
  locations = [
    { code: 'PNQ', name: 'Pune' },
    { code: 'BOM', name: 'Mumbai' },
    { code: 'NAG', name: 'Nagpur' },
  ];

  allCars = signal<Car[]>([
    { id: 'c1', brand: 'Maruti', model: 'Baleno', type: 'hatchback', seats: 5, transmission: 'manual', fuel: 'petrol', dailyPrice: 1800, rating: 4.3, imageUrl: 'assets/cars/baleno.jpg', locations: ['PNQ', 'BOM'] },
    { id: 'c2', brand: 'Honda', model: 'City', type: 'sedan', seats: 5, transmission: 'automatic', fuel: 'petrol', dailyPrice: 2700, rating: 4.6, imageUrl: 'assets/cars/city.jpg', locations: ['BOM'] },
    { id: 'c3', brand: 'Mahindra', model: 'XUV700', type: 'suv', seats: 7, transmission: 'automatic', fuel: 'diesel', dailyPrice: 4200, rating: 4.7, imageUrl: 'assets/cars/xuv700.jpg', locations: ['PNQ', 'NAG'] },
    { id: 'c4', brand: 'Hyundai', model: 'i20', type: 'hatchback', seats: 5, transmission: 'manual', fuel: 'petrol', dailyPrice: 1700, rating: 4.1, imageUrl: 'assets/cars/i20.jpg', locations: ['PNQ'] },
    { id: 'c5', brand: 'Tata', model: 'Nexon EV', type: 'suv', seats: 5, transmission: 'automatic', fuel: 'ev', dailyPrice: 3600, rating: 4.5, imageUrl: 'assets/cars/nexon-ev.jpg', locations: ['BOM', 'PNQ'] },
    { id: 'c6', brand: 'Skoda', model: 'Slavia', type: 'sedan', seats: 5, transmission: 'automatic', fuel: 'petrol', dailyPrice: 3200, rating: 4.4, imageUrl: 'assets/cars/slavia.jpg', locations: ['NAG'] },
    { id: 'c7', brand: 'Toyota', model: 'Fortuner', type: 'suv', seats: 7, transmission: 'automatic', fuel: 'diesel', dailyPrice: 6000, rating: 4.8, imageUrl: 'assets/cars/fortuner.jpg', locations: ['BOM'] },
    { id: 'c8', brand: 'Mercedes', model: 'C-Class', type: 'luxury', seats: 5, transmission: 'automatic', fuel: 'petrol', dailyPrice: 9500, rating: 4.9, imageUrl: 'assets/cars/cclass.jpg', locations: ['BOM', 'PNQ'] },
  ]);

  // ---------- Filters & Sorting ----------
  q = signal('');             // search query
  type = signal<CarType | 'all'>('all');
  transmission = signal<Transmission | 'all'>('all');
  fuel = signal<Fuel | 'all'>('all');
  seatsMin = signal(4);
  priceMax = signal(10000);
  location = signal<string | 'all'>('all');

  sortKey = signal<'price' | 'rating' | 'seats'>('price');
  sortDir = signal<'asc' | 'desc'>('asc');

  // ---------- Pagination ----------
  pageIndex = signal(0);
  pageSize = signal(8);

  // ---------- Derived lists ----------
  filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.allCars().filter(c => {
      const matchesQ = !q || `${c.brand} ${c.model}`.toLowerCase().includes(q);
      const matchesType = this.type() === 'all' || c.type === this.type();
      const matchesTrans = this.transmission() === 'all' || c.transmission === this.transmission();
      const matchesFuel = this.fuel() === 'all' || c.fuel === this.fuel();
      const matchesSeats = c.seats >= this.seatsMin();
      const matchesPrice = c.dailyPrice <= this.priceMax();
      const matchesLoc = this.location() === 'all' || c.locations.includes(this.location()!);
      return matchesQ && matchesType && matchesTrans && matchesFuel && matchesSeats && matchesPrice && matchesLoc;
    });
  });

  sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const arr = [...this.filtered()];
    arr.sort((a, b) => {
      let va = (key === 'price' ? a.dailyPrice : key === 'rating' ? a.rating : a.seats);
      let vb = (key === 'price' ? b.dailyPrice : key === 'rating' ? b.rating : b.seats);
      return dir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  });

  total = computed(() => this.sorted().length);

  paged = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  // ---------- Actions ----------
  clearFilters() {
    this.q.set('');
    this.type.set('all');
    this.transmission.set('all');
    this.fuel.set('all');
    this.seatsMin.set(4);
    this.priceMax.set(10000);
    this.location.set('all');
    this.sortKey.set('price');
    this.sortDir.set('asc');
    this.pageIndex.set(0);
  }

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  toggleSort(k: 'price' | 'rating' | 'seats') {
    if (this.sortKey() === k) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(k);
      this.sortDir.set('asc');
    }
    this.pageIndex.set(0);
  }

  // UI helpers
  ratingArray(r: number) {
    // returns [filled, half, empty] counts for 5 stars
    const filled = Math.floor(r);
    const half = r - filled >= 0.5 ? 1 : 0;
    const empty = 5 - filled - half;
    return { filled, half, empty };
  }
  onQInput(ev: Event) {
    const v = (ev.target as HTMLInputElement)?.value ?? '';
    this.q.set(v);
    this.pageIndex.set(0);
  }
onPriceInput(ev: Event) {
  const target = ev.target as HTMLInputElement | null;
  const v = Number(target?.value ?? 0);
  this.priceMax.set(v);
  this.pageIndex.set(0);
}

onSeatsInput(ev: Event) {
  const target = ev.target as HTMLInputElement | null;
  const v = Number(target?.value ?? 0);
  this.seatsMin.set(v);
  this.pageIndex.set(0);
}


  currency(n: number) { return '₹' + new Intl.NumberFormat('en-IN').format(n); }

  // future hooks
  viewCar(c: Car) { /* TODO: route to details */ }
  bookCar(c: Car) { this.router.navigate(['/layout/booking'], { state: { car: c } }); }
}
