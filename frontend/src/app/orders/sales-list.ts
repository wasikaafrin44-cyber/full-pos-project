import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../shared/services/order.service';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Sales History</h2>
          <p class="text-muted small">View and manage all your sales transactions</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm border-0 bg-white"
            (click)="exportPDF()">
            <i class="bi bi-download me-1 text-primary"></i> Export PDF
          </button>
          <!-- <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm border-0 bg-white"
            (click)="printAll()">
            <i class="bi bi-printer me-1 text-primary"></i> Print All
          </button> -->
        </div>
      </div>

      <div class="card border-0 shadow-sm" id="sales-table-area">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-muted small text-uppercase">
              <tr>
                <th class="py-3">Order ID</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th class="text-end px-4 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orderService.orders(); track order.id) {
                <tr>
                  <td><span class="fw-bold text-primary">#ORD-{{ order.id }}</span></td>
                  <td class="fw-medium">{{ order.customerName }}</td>
                  <td class="text-muted small">{{ order.date | date:'mediumDate' }}</td>
                  <td class="text-muted small">{{ order.paymentMethod || 'CASH' }}</td>
                  <td class="fw-bold text-dark">{{ (order.finalTotal ?? order.total) | currency }}</td>
                  <td>
                    <span class="badge rounded-pill px-3 py-2"
                      [ngClass]="{
                        'bg-success-subtle text-success': order.status === 'Completed',
                        'bg-warning-subtle text-warning': order.status === 'Pending',
                        'bg-danger-subtle text-danger':   order.status === 'Cancelled'
                      }">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="text-end px-4 no-print">
                    @if (order.status !== 'Cancelled') {
                      <button class="btn btn-icon btn-light ms-1"
                        (click)="updateStatus(order.id, 'Cancelled')">
                        <i class="bi bi-x-circle text-danger"></i>
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-5 text-muted">
                    <i class="bi bi-receipt fs-1 d-block mb-3 opacity-25"></i>
                    No sales records found.
                  </td>
                </tr>
              }
            </tbody>

            <!-- ✅ Summary footer -->
            <tfoot class="bg-light fw-bold">
              <tr>
                <td colspan="4" class="text-end py-3 px-4">Total Revenue:</td>
                <td class="text-success py-3">{{ totalRevenue() | currency }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    // @media print {
    //   body * { visibility: hidden !important; }
    //   #sales-print-area, #sales-print-area * { visibility: visible !important; }
    //   #sales-print-area {
    //     position: fixed;
    //     top: 0; left: 0;
    //     width: 100%;
    //   }
    //   .no-print { display: none !important; }
    //   @page { margin: 10mm; size: A4 landscape; }
    // }
  `]
})
export class SalesListComponent implements OnInit {
  constructor(public orderService: OrderService) {}

  ngOnInit(): void {}

  totalRevenue(): number {
    return this.orderService.orders()
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + (o.finalTotal ?? o.total ?? 0), 0);
  }

  // ✅ Export PDF using browser print into PDF
  exportPDF(): void {
    const orders = this.orderService.orders();
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const rows = orders.map(o => `
      <tr>
        <td>#ORD-${o.id}</td>
        <td>${o.customerName || 'Walk-in'}</td>
        <td>${typeof o.date === 'string' ? o.date : new Date(o.date).toLocaleDateString()}</td>
        <td>${o.paymentMethod || 'CASH'}</td>
        <td>$${(o.finalTotal ?? o.total ?? 0).toFixed(2)}</td>
        <td>${o.status}</td>
      </tr>
    `).join('');

    const total = this.totalRevenue().toFixed(2);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report — ${today}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #1a1a1a; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
          .brand { font-size: 22px; font-weight: 700; color: #1a73e8; }
          .brand span { font-size: 13px; font-weight: 400; color: #666; display: block; margin-top: 4px; }
          .report-info { text-align: right; font-size: 13px; color: #666; }
          .report-info strong { color: #1a1a1a; }

          h2 { font-size: 18px; color: #0d47a1; margin-bottom: 16px;
               padding-bottom: 8px; border-bottom: 2px solid #e8f4fd; }

          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead { background-color: #e8f4fd; }
          th { padding: 10px 14px; text-align: left; font-weight: 600;
               text-transform: uppercase; font-size: 11px; color: #1a73e8; }
          td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
          tr:nth-child(even) { background-color: #fafafa; }
          tr:last-child td { border-bottom: none; }

          .status-completed { color: #2e7d32; background: #e8f5e9;
            padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .status-pending { color: #f57f17; background: #fff8e1;
            padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .status-cancelled { color: #c62828; background: #fce4ec;
            padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

          .summary { margin-top: 20px; text-align: right; }
          .summary-box { display: inline-block; background: #e8f5e9;
            padding: 12px 24px; border-radius: 10px; }
          .summary-box .label { font-size: 12px; color: #2e7d32; text-transform: uppercase; }
          .summary-box .value { font-size: 22px; font-weight: 700; color: #1b5e20; }

          .footer { margin-top: 40px; text-align: center; font-size: 11px;
            color: #999; border-top: 1px solid #eee; padding-top: 12px; }

          @page { margin: 15mm; size: A4 landscape; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Point Of Sales
              <span>Sales Report</span>
            </div>
          </div>
          <div class="report-info">
            <strong>Generated:</strong> ${today}<br>
            <strong>Total Orders:</strong> ${orders.length}<br>
            <strong>Completed:</strong> ${orders.filter(o => o.status === 'Completed').length}
          </div>
        </div>

        <h2>Sales Transactions</h2>

        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong style="color:#1a73e8;">#ORD-${o.id}</strong></td>
                <td>${o.customerName || 'Walk-in'}</td>
                <td>${typeof o.date === 'string' ? o.date : new Date(o.date).toLocaleDateString()}</td>
                <td>${o.paymentMethod || 'CASH'}</td>
                <td><strong>$${(o.finalTotal ?? o.total ?? 0).toFixed(2)}</strong></td>
                <td><span class="status-${o.status.toLowerCase()}">${o.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="label">Total Revenue</div>
            <div class="value">$${total}</div>
          </div>
        </div>

        <div class="footer">
          Point Of Sales System &nbsp;•&nbsp; Generated on ${today} &nbsp;•&nbsp; Confidential
        </div>
      </body>
      </html>
    `;

    // ✅ Open in new window and trigger print-to-PDF
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  }

  // ✅ Print the table directly
  printAll(): void {
    const printArea = document.getElementById('sales-table-area');
    if (!printArea) return;

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales History — ${today}</title>
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <style>
          body { padding: 20px; font-family: 'Segoe UI', sans-serif; }
          h4 { color: #1a73e8; }
          .no-print { display: none !important; }
          @page { margin: 10mm; size: A4 landscape; }
        </style>
      </head>
      <body>
        <div class="d-flex justify-content-between mb-3">
          <h4 class="fw-bold">Sales History</h4>
          <span class="text-muted small">${today}</span>
        </div>
        ${printArea.outerHTML}
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 800);
    }
  }

  updateStatus(id: number, status: 'Pending' | 'Completed' | 'Cancelled') {
    if (confirm(`Are you sure you want to change status to ${status}?`)) {
      this.orderService.updateOrderStatus(id, status);
    }
  }
}