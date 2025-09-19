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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';

type Role = 'admin' | 'ops' | 'agent' | 'viewer';
const ROLES: Role[] = ['admin','ops','agent','viewer'] as const;

const MODULES = ['Bookings','Cars','Customers','Branches','Maintenance','Reports'] as const;
type ModuleName = typeof MODULES[number];
type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve';

type Matrix = Record<ModuleName, Record<Action, boolean>>;

interface iUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt: string;   // ISO
  lastLogin?: string;  // ISO
}

/* ---------- Default role templates ---------- */
function fullPerm(): Record<Action, boolean> { return { view:true, create:true, edit:true, delete:true, approve:true }; }
function readOnly(): Record<Action, boolean>  { return { view:true, create:false, edit:false, delete:false, approve:false }; }

const DEFAULT_MATRIX: Record<Role, Matrix> = {
  admin: MODULES.reduce((acc, m) => ({ ...acc, [m]: fullPerm() }), {} as Matrix),
  ops: {
    Bookings:  { view:true, create:true, edit:true, delete:false, approve:true },
    Cars:      { view:true, create:true, edit:true, delete:false, approve:false },
    Customers: { view:true, create:true, edit:true, delete:false, approve:false },
    Branches:  { view:true, create:false, edit:true, delete:false, approve:false },
    Maintenance:{ view:true, create:true, edit:true, delete:false, approve:false },
    Reports:   { view:true, create:false, edit:false, delete:false, approve:false },
  },
  agent: {
    Bookings:  { view:true, create:true, edit:false, delete:false, approve:false },
    Cars:      readOnly(),
    Customers: { view:true, create:true, edit:false, delete:false, approve:false },
    Branches:  readOnly(),
    Maintenance:readOnly(),
    Reports:   { view:true, create:false, edit:false, delete:false, approve:false },
  },
  viewer: MODULES.reduce((acc, m) => ({ ...acc, [m]: readOnly() }), {} as Matrix),
};

/* ---------- Reset Password Dialog ---------- */
@Component({
  selector: 'app-reset-pass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Reset password</h2>
    <form class="p-3" [formGroup]="form">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Temporary password</mat-label>
        <input matInput formControlName="temp" placeholder="e.g. User@123">
      </mat-form-field>
      <div class="d-flex gap-2 justify-end mt-2">
        <button mat-button mat-dialog-close>Close</button>
        <button mat-raised-button color="primary" [mat-dialog-close]="form.value.temp || 'Demo@123'">Set</button>
      </div>
    </form>
  `,
  styles: [`.w-100{width:100%}.p-3{padding:12px}.gap-2{gap:8px}.justify-end{justify-content:flex-end;display:flex}.mt-2{margin-top:8px}`]
})
export class ResetPassDialog {
  private fb = inject(FormBuilder);
  form = this.fb.group({ temp: [''] });
}

/* ----------------- Main: Users / Roles ----------------- */
@Component({
  selector: 'app-users-roles',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatTooltipModule, MatDividerModule, MatSnackBarModule,
    MatDialogModule, MatTabsModule, MatCheckboxModule
  ],
  templateUrl: './users-roles.html',
  styleUrls: ['./users-roles.scss']
})
export class UsersRoles {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  /* Demo users */
  users = signal<iUser[]>([
    { id:'U-1004', name:'Admin User',  email:'admin@demo.com',  phone:'9000000001', role:'admin',  active:true,  createdAt:'2025-01-05T10:00:00', lastLogin:'2025-09-15T09:12:00' },
    { id:'U-1003', name:'Ops Lead',    email:'ops@demo.com',    phone:'9000000002', role:'ops',    active:true,  createdAt:'2025-02-10T12:00:00', lastLogin:'2025-09-18T18:22:00' },
    { id:'U-1002', name:'Agent One',   email:'agent@demo.com',  phone:'9000000003', role:'agent',  active:false, createdAt:'2025-04-02T08:45:00' },
    { id:'U-1001', name:'View Only',   email:'viewer@demo.com', phone:'9000000004', role:'viewer', active:true,  createdAt:'2025-05-23T14:20:00' },
  ]);

  /* Search & filters */
  q = signal<string>(''); 
  roleFilter = signal<Role | ''>('');
  onlyActive = signal<boolean>(false);

  filtered = computed(() => {
    const s = this.q().toLowerCase().trim();
    const rf = this.roleFilter();
    const active = this.onlyActive();
    return this.users().filter(u => {
      const inSearch = !s || `${u.name} ${u.email} ${u.phone} ${u.id}`.toLowerCase().includes(s);
      const inRole = !rf || u.role === rf;
      const inActive = !active || u.active;
      return inSearch && inRole && inActive;
    });
  });

  /* Form: add / edit */
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    role: ['agent' as Role, [Validators.required]],
    active: [true],
    setPassword: [false],
    password: ['']
  });

  editing = signal<string | null>(null);
  private seq = 1004;
  private nextId() { this.seq += 1; return `U-${this.seq}`; }

  startEdit(u: iUser) {
    this.editing.set(u.id);
    this.form.reset({ name:u.name, email:u.email, phone:u.phone ?? '', role:u.role, active:u.active, setPassword:false, password:'' });
  }

  cancelEdit() {
    this.editing.set(null);
    this.form.reset({ name:'', email:'', phone:'', role:'agent', active:true, setPassword:false, password:'' });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value as any;

    if (this.editing()) {
      const id = this.editing()!;
      this.users.update(list => list.map(x => x.id===id ? ({ ...x, name:v.name, email:v.email, phone:v.phone, role:v.role, active: !!v.active }) : x));
      this.snack.open('User updated ✅', 'OK', { duration: 1800 });
    } else {
      const user: iUser = {
        id: this.nextId(),
        name: v.name, email: v.email, phone: v.phone, role: v.role, active: !!v.active,
        createdAt: new Date().toISOString()
      };
      this.users.update(list => [user, ...list]);
      this.snack.open('User added ✅', 'OK', { duration: 1800 });
    }

    // (demo) password सेट केला असेल तर console मध्ये
    if (v.setPassword && v.password) {
      console.log('TEMP PASSWORD for', this.editing() ?? 'new user', '=>', v.password);
    }
    this.cancelEdit();
  }

  remove(u: iUser) {
    if (!confirm(`Delete user ${u.name}?`)) return;
    this.users.update(list => list.filter(x => x.id !== u.id));
  }

  toggleActive(u: iUser) {
    this.users.update(list => list.map(x => x.id===u.id ? ({ ...x, active: !x.active }) : x));
  }

  resetPassword(u: iUser) {
    this.dialog.open(ResetPassDialog).afterClosed().subscribe(temp => {
      if (!temp) return;
      console.log('RESET PASSWORD for', u.email, '=>', temp);
      this.snack.open('Temporary password set (console) 🔐', 'OK', { duration: 2000 });
    });
  }

  exportCsv() {
    const head = ['ID','Name','Email','Phone','Role','Active','CreatedAt','LastLogin'];
    const lines = this.filtered().map(u => [
      u.id, u.name, u.email, u.phone ?? '', u.role,
      u.active ? 'YES' : 'NO', u.createdAt, u.lastLogin ?? ''
    ]);
    const csv = [head, ...lines].map(r=>r.join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users.csv';
    a.click(); URL.revokeObjectURL(a.href);
  }

  /* -------- Roles Matrix (editable templates) -------- */
  selectedRole = signal<Role>('ops');
  roleMatrix = signal<Record<Role, Matrix>>(
    JSON.parse(JSON.stringify(DEFAULT_MATRIX)) // deep copy for demo edit
  );

  rolePerm(role: Role, mod: ModuleName, act: Action) {
    return this.roleMatrix()[role][mod][act];
  }
  togglePerm(role: Role, mod: ModuleName, act: Action, checked: boolean) {
    const copy = structuredClone(this.roleMatrix());
    copy[role][mod][act] = checked;
    this.roleMatrix.set(copy);
  }
  resetRole(role: Role) {
    const copy = structuredClone(this.roleMatrix());
    copy[role] = JSON.parse(JSON.stringify(DEFAULT_MATRIX[role]));
    this.roleMatrix.set(copy);
  }

  /* derived chips for form: show what role can do */
  effectiveChips = computed(() => {
    const r = (this.form.value.role || 'agent') as Role;
    const mx = this.roleMatrix()[r];
    const chips: string[] = [];
    for (const m of MODULES) {
      const a = mx[m];
      const acts = (['view','create','edit','delete','approve'] as Action[]).filter(k => a[k]);
      if (acts.length) chips.push(`${m}: ${acts.join('/')}`);
    }
    return chips;
  });
}
