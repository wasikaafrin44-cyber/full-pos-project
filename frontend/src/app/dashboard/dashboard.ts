import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DashboardService, DashboardSummary } from './dashboard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private subscription = new Subscription();

  summary = signal<DashboardSummary | null>(null);

  today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  ngOnInit(): void {
    this.subscription.add(
      this.dashboardService.dashboard$.subscribe(data => {
        this.summary.set(data);
      })
    );
    this.dashboardService.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}