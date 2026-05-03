import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export type PosRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface AuthUser {
  username: string;
  email?: string;
  role: PosRole;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<AuthUser | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(private router: Router, private http: HttpClient) {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        this.currentUserSignal.set(this.normalizeUser(JSON.parse(raw)));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<Partial<AuthUser>>(`${API_BASE_URL}/auth/login`, { username: email, password }).pipe(
      map(raw => this.persistUser(raw)),
      catchError(() => {
        const offline = this.tryOfflineLogin(email, password);
        if (offline) {
          return of(this.persistUser(offline));
        }
        return throwError(() => new Error('Invalid credentials'));
      })
    );
  }

  private tryOfflineLogin(email: string, password: string): AuthUser | null {
    const demo: Record<string, { password: string; role: PosRole }> = {
      'admin@pos.com': { password: 'admin123', role: 'ADMIN' },
      'manager@pos.com': { password: 'manager123', role: 'MANAGER' },
      'cashier@pos.com': { password: 'cashier123', role: 'CASHIER' },
      'pos@gmail.com': { password: 'admin123', role: 'ADMIN' }
    };
    const row = demo[email.trim().toLowerCase()];
    if (row && row.password === password) {
      return {
        username: email,
        email,
        role: row.role,
        token: 'offline-token'
      };
    }
    return null;
  }

  private persistUser(raw: Partial<AuthUser>): AuthUser {
    const user = this.normalizeUser(raw);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSignal.set(user);
    return user;
  }

  private normalizeUser(raw: Partial<AuthUser>): AuthUser {
    const email = String(raw.email ?? raw.username ?? '');
    const role = this.normalizeRole(String(raw.role ?? 'CASHIER'));
    return {
      username: email,
      email,
      role,
      token: String(raw.token ?? '')
    };
  }

  private normalizeRole(r: string): PosRole {
    const u = r.toUpperCase();
    if (u.includes('ADMIN')) return 'ADMIN';
    if (u.includes('MANAGER')) return 'MANAGER';
    return 'CASHIER';
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
