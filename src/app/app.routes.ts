import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },

  {
    path: 'layout',
    loadComponent: () => import('./pages/layout/layout').then(m => m.Layout), // <— Class = Layout
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',          loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'cars',               loadComponent: () => import('./pages/cars/cars').then(m => m.Cars) },
      { path: 'manage-bookings',    loadComponent: () => import('./pages/bookings/bookings').then(m => m.Bookings) },
      { path: 'customers',          loadComponent: () => import('./pages/customer/customer').then(m => m.Customer) },
      { path: 'reports',            loadComponent: () => import('./pages/reports/reports').then(m => m.Reports) },
      { path: 'car-master',         loadComponent: () => import('./pages/car-master/car-master').then(m => m.CarMaster) },
      { path: 'branches',           loadComponent: () => import('./pages/branches/branches').then(m => m.Branches) },
      { path: 'maintenance',        loadComponent: () => import('./pages/maintenance/maintenance').then(m => m.Maintenance) },
      { path: 'return-inspection',  loadComponent: () => import('./pages/return-inspection/return-inspection').then(m => m.ReturnInspection) },
      { path: 'users-roles',        loadComponent: () => import('./pages/users-roles/users-roles').then(m => m.UsersRoles) },
      { path: 'profile',            loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) },
      { path: 'settings',           loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) } // demo
    ]
  },

  { path: '**', redirectTo: 'login' }
];
