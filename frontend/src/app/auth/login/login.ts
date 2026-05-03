import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

interface RoleCard {
  role: string;
  email: string;
  password: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  roleCards: RoleCard[] = [
    {
      role: 'Admin',
      email: 'admin@pos.com',
      password: '',
      icon: 'bi-shield-lock-fill',
      color: '#1a73e8',
      bg: '#e8f4fd',
      description: 'Full access'
    },
    {
      role: 'Manager',
      email: 'manager@pos.com',
      password: '',
      icon: 'bi-person-workspace',
      color: '#2e7d32',
      bg: '#e8f5e9',
      description: 'No employees'
    },
    {
      role: 'Cashier',
      email: 'cashier@pos.com',
      password: '',
      icon: 'bi-cash-register',
      color: '#7b1fa2',
      bg: '#f3e5f5',
      description: 'Sales only'
    }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  selectRole(card: RoleCard): void {
    this.email = card.email;
    this.password = card.password;
    this.errorMessage.set('');
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Email and password are required.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/pos-layout/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Invalid credentials. Please try again.');
      }
    });
  }
}