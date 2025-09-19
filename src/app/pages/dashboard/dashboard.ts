import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

type Status = 'confirmed' | 'ongoing' | 'cancelled';

interface BookingRow {
  id: string;
  customer: string;
  car: string;
  pickup: string; // ISO
  drop: string;   // ISO
  status: Status;
}
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatProgressBarModule, MatTableModule,
    MatMenuModule, MatTooltipModule, MatDividerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
 // ===== KPIs (mock) =====
  totalRevenueToday = signal(128_500); // ₹
  activeRentals     = signal(23);
  newBookings       = signal(14);
  fleetUtil         = signal(78); // %

  // ===== Fleet by location (mock) =====
  fleetByLocation = signal([
    { name: 'Pune',    used: 26, total: 32, color: 'primary' },
    { name: 'Mumbai',  used: 18, total: 25, color: 'accent'  },
    { name: 'Nagpur',  used:  9, total: 14, color: 'warn'    }
  ]);
  percent = (used: number, total: number) => Math.round((used / total) * 100);

  // ===== Revenue (last 7 days) mock for sparkline =====
  revenue7d = signal([84, 92, 70, 110, 105, 130, 125]); // in thousands
  // map to 0..1 normalized points for simple inline SVG polyline
  sparklinePoints = computed(() => {
    const d = this.revenue7d();
    const max = Math.max(...d);
    const min = Math.min(...d);
    const range = Math.max(1, max - min);
    const w = 260, h = 80, pad = 6;
    const stepX = (w - pad * 2) / (d.length - 1);
    return d.map((v, i) => {
      const x = pad + stepX * i;
      const y = pad + (h - pad * 2) * (1 - (v - min) / range);
      return `${x},${y}`;
    }).join(' ');
  });

  // ===== Recent bookings table (mock) =====
  displayedColumns = ['id', 'customer', 'car', 'pickup', 'drop', 'status', 'actions'];
  rows = signal<BookingRow[]>([
    { id: 'BK-1042', customer: 'A. Kulkarni', car: 'Honda City',     pickup: '2025-09-18T10:00:00', drop: '2025-09-20T09:30:00', status: 'ongoing'   },
    { id: 'BK-1041', customer: 'R. Sharma',   car: 'Mahindra XUV700', pickup:'2025-09-17T08:30:00', drop: '2025-09-19T11:00:00', status: 'confirmed' },
    { id: 'BK-1040', customer: 'S. Patel',    car: 'Maruti Baleno',   pickup:'2025-09-16T09:00:00', drop: '2025-09-17T09:00:00', status: 'cancelled' },
    { id: 'BK-1039', customer: 'P. Desai',    car: 'Hyundai i20',     pickup:'2025-09-16T14:00:00', drop: '2025-09-18T09:00:00', status: 'confirmed' },
  ]);

  chipColor(s: Status): 'primary' | 'accent' | 'warn' {
    switch (s) {
      case 'confirmed': return 'primary';
      case 'ongoing':   return 'accent';
      default:          return 'warn';
    }
  }

  // ===== Actions (hook to real flows later) =====
  refresh() { /* TODO: call API */ }
  createBooking() { /* TODO: route to booking wizard */ }
  viewRow(row: BookingRow) { /* TODO: open detail */ }
  cancelRow(row: BookingRow) { /* TODO: cancel -> API */ }
}
