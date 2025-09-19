import { Component, signal } from '@angular/core';
import { CommonModule, NgIf, NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatBadgeModule }   from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatDividerModule }   from '@angular/material/divider';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule, MatDividerModule
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  collapsed   = signal(true);
  showSearch  = signal(false);
  theme       = signal<'dark'|'light'>('dark');
  notifCount  = signal(3);
  cartCount   = signal(1);
  megaOpen    = signal(false);

  toggle()            { this.collapsed.update(v => !v); }
  toggleSearch()      { this.showSearch.update(v => !v); }
  toggleMega()        { this.megaOpen.update(v => !v); }
  closeMega()         { this.megaOpen.set(false); }

  toggleTheme() {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
    document.body.classList.toggle('light-theme', this.theme() === 'light');
  }

  onGlobalSearch(ev: Event) {
    const q = (ev.target as HTMLInputElement).value.trim();
    console.log('Global search =>', q);
  }
}
