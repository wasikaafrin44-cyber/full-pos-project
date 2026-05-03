import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError, tap } from 'rxjs';
import { OrderService, Order } from '../shared/services/order.service';
import { API_BASE_URL } from '../shared/constants/api-url';

export interface DashboardSummary {
  totalSalesToday: number;
  productTypesCount: number;
  lowStockAlertCount: number;
  customersPurchasedToday: number;
  lowStockThreshold: number;
  recentSales: { id: number; customerName: string; date: string; total: number; status: string }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private orderService = inject(OrderService);
  private http = inject(HttpClient);

  private dashboardSubject = new BehaviorSubject<DashboardSummary | null>(null);
  dashboard$: Observable<DashboardSummary | null> = this.dashboardSubject.asObservable();

  loadDashboardData(): void {
    this.http.get<DashboardSummary>(`${API_BASE_URL}/dashboard/summary`).pipe(
      tap(data => this.dashboardSubject.next(data)),
      catchError(() => {
        this.fallbackFromLocalOrders();
        return of(null);
      })
    ).subscribe();
  }

  /** When backend is offline, derive minimal metrics from cached orders + refresh orders first */
  private fallbackFromLocalOrders(): void {
    this.orderService.getOrders().subscribe(() => {
      const orders = this.orderService.orders();
      const today = new Date().toISOString().slice(0, 10);
      const completedToday = orders.filter(o => {
        const d = typeof o.date === 'string' ? o.date.slice(0, 10) : new Date(o.date).toISOString().slice(0, 10);
        return d === today && o.status === 'Completed';
      });
      const totalSalesToday = completedToday.reduce((s, o) => s + (o.finalTotal ?? o.total ?? 0), 0);
      const recentSales = [...orders]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5)
        .map(o => ({
          id: o.id,
          customerName: o.customerName,
          date: typeof o.date === 'string' ? o.date : new Date(o.date).toISOString(),
          total: o.finalTotal ?? o.total,
          status: o.status
        }));

      this.dashboardSubject.next({
        totalSalesToday,
        productTypesCount: 0,
        lowStockAlertCount: 0,
        customersPurchasedToday: new Set(completedToday.map(o => o.customerId).filter(Boolean)).size,
        lowStockThreshold: 10,
        recentSales
      });
    });
  }
}
