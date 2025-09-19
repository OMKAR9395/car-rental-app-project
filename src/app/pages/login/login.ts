import { Component, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';

declare const particlesJS: any; // CDN मधील global

function matchFieldsValidator(a: string, b: string) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const av = ctrl.get(a)?.value;
    const bv = ctrl.get(b)?.value;
    if (av === null || bv === null) return null;
    return av === bv ? null : { mismatch: true };
  };
}
@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements AfterViewInit{
  router = inject(Router);
private fb = inject(FormBuilder);

  // Tabs
  activeTab = signal<'login' | 'register'>('login');
  isLogin = computed(() => this.activeTab() === 'login');

  // Login form
 loginForm = this.fb.group({
  usernameOrEmail: ['', [Validators.required]],
  password: ['', [Validators.required]]
});

  // Register form
  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  }, { validators: matchFieldsValidator('password', 'confirmPassword') });

  ngAfterViewInit(): void {
    // particles init (defensive)
    try {
      if (typeof particlesJS === 'function') {
        particlesJS('particles-js', {
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#6c5ce7' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#48dbfb', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 3, out_mode: 'out' }
          },
          interactivity: {
            events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' } },
            modes: { grab: { distance: 140, line_linked: { opacity: 0.6 } } }
          },
          retina_detect: true
        });
      }
    } catch { }
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
  }

onLogin() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const { usernameOrEmail, password } = this.loginForm.value;

  // Hardcoded check
  if (usernameOrEmail === 'admin' && password === 'a123') {
    alert('Login Successful ✅');
    this.router.navigate(['/layout']); 
  } else {
    alert('Invalid Credentials ❌');
  }
}

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const payload = this.registerForm.value;
  }

  // Helpers
  hasErr(formCtrl: AbstractControl | null, err: string) {
    return !!formCtrl && (formCtrl.touched || formCtrl.dirty) && formCtrl.hasError(err);
  }
}
