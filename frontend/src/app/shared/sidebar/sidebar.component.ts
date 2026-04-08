import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  subItems?: { label: string; route: string }[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div [class.collapsed]="isCollapsed()" class="d-flex flex-column vh-100 sidebar text-white p-3 shadow-lg">
      <div class="d-flex justify-content-between align-items-center mb-4 px-2">
        @if (!isCollapsed()) {
          <div class="d-flex align-items-center gap-2">
            <div class="bg-primary rounded p-1">
              <i class="bi bi-shop fs-5"></i>
            </div>
            <h5 class="m-0 fw-bold tracking-tight">Point Of Sales</h5>
          </div>
        }
        <button class="btn btn-sm text-white opacity-75 hover-opacity-100" (click)="toggleSidebar()">
          <i class="bi" [class.bi-list]="!isCollapsed()" [class.bi-chevron-right]="isCollapsed()"></i>
        </button>
      </div>

      <div class="nav-container flex-grow-1 overflow-auto">
        <ul class="nav nav-pills flex-column gap-1">
          @for (item of menuItems(); track item.label) {
            <li class="nav-item">
              @if (!item.subItems) {
                <a [routerLink]="item.route"
                   routerLinkActive="active"
                   class="nav-link text-white d-flex align-items-center"
                   [title]="item.label">
                  <i [class]="item.icon" class="me-3 fs-5"></i>
                  @if (!isCollapsed()) {
                    <span class="menu-label">{{ item.label }}</span>
                  }
                </a>
              } @else {
                <div class="dropdown-container">
                  <a (click)="toggleSubMenu(item.label)"
                     class="nav-link text-white d-flex align-items-center justify-content-between cursor-pointer"
                     [class.active-parent]="isSubMenuActive(item)"
                     [title]="item.label">
                    <div class="d-flex align-items-center">
                      <i [class]="item.icon" class="me-3 fs-5"></i>
                      @if (!isCollapsed()) {
                        <span class="menu-label">{{ item.label }}</span>
                      }
                    </div>
                    @if (!isCollapsed()) {
                        <i class="bi bi-chevron-down transition-transform" [class.rotate-180]="openMenuKey() === item.label"></i>
                    }
                  </a>

                  <div class="submenu overflow-hidden transition-height"
                       [style.height]="openMenuKey() === item.label && !isCollapsed() ? (item.subItems.length * 40) + 'px' : '0px'">
                    <ul class="nav flex-column ms-4 mt-1 border-start border-secondary border-opacity-25">
                      @for (sub of item.subItems; track sub.label) {
                        <li>
                          <a [routerLink]="sub.route"
                             routerLinkActive="active"
                             class="nav-link py-2 text-white-50 hover-text-white"
                             style="font-size: 0.875rem;">
                            {{ sub.label }}
                          </a>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              }
            </li>
          }
        </ul>
      </div>

      <!-- Replace the existing bottom section with this -->
<div class="mt-auto border-top border-secondary border-opacity-25 pt-3">
  @if (!isCollapsed()) {
    <div class="px-3 mb-3">
      <!-- Role Badge -->
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="badge rounded-pill px-3 py-2 fw-semibold"
          [style.background-color]="getRoleBg()"
          [style.color]="getRoleColor()">
          <i class="bi me-1" [class]="getRoleIcon()"></i>
          {{ authService.currentUser()?.role }}
        </span>
      </div>
      <div class="small text-muted text-uppercase" style="font-size:0.7rem;">Signed in as</div>
      <div class="small text-white-50 text-truncate">{{ authService.currentUser()?.username }}</div>
    </div>
  }
  <a class="nav-link text-white d-flex align-items-center px-3 cursor-pointer" (click)="logout()">
    <i class="bi bi-box-arrow-right me-3 fs-5 text-danger"></i>
    @if (!isCollapsed()) {
      <span>Logout</span>
    }
  </a>
</div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      background-color: #0f172a !important;
      z-index: 1000;
      transition: width 0.3s ease;
    }
    .sidebar.collapsed {
      width: var(--sidebar-collapsed-width);
    }
    .menu-label {
      white-space: nowrap;
      font-weight: 500;
    }
    .transition-transform { transition: transform 0.2s ease; }
    .rotate-180 { transform: rotate(180deg); }
    .transition-height { transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .cursor-pointer { cursor: pointer; }
    .hover-opacity-100:hover { opacity: 1 !important; }

    .nav-link {
        border-radius: 8px;
        transition: all 0.2s;
        &:hover { background: rgba(255,255,255,0.05); }
        &.active { background: #4f46e5 !important; color: white !important; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    }

    .active-parent {
         background: rgba(79, 70, 229, 0.1);
         color: #818cf8 !important;
    }

    .hover-text-white:hover { color: white !important; }
  `]
})
export class SidebarComponent {
  isCollapsed = signal(false);
  openMenuKey = signal<string | null>(null);

  menuItems = computed(() => {
    const role = (this.authService.currentUser()?.role ?? 'CASHIER').toUpperCase();
    const full: MenuItem[] = [
      { label: 'Dashboard', icon: 'bi bi-grid-1x2', route: '/pos-layout/dashboard' },
      {
        label: 'Inventory',
        icon: 'bi bi-box-seam',
        subItems: [
          { label: 'Products', route: '/pos-layout/products' },
          { label: 'Categories', route: '/pos-layout/inventory/categories' },
          { label: 'Brands', route: '/pos-layout/inventory/brands' }
        ]
      },
      {
        label: 'Sales',
        icon: 'bi bi-cart3',
        subItems: [
          { label: 'New Sale', route: '/pos-layout/sales/new' },
          { label: 'Sales List', route: '/pos-layout/sales/list' }
        ]
      },
      { label: 'Customers', icon: 'bi bi-people', route: '/pos-layout/customers' },
      {
        label: 'Employees',
        icon: 'bi bi-person-badge',
        subItems: [
          { label: 'Staff List', route: '/pos-layout/employee/list' },
          { label: 'Roles', route: '/pos-layout/employee/roles' }
        ]
      },
      {
        label: 'Reports',
        icon: 'bi bi-bar-chart-line',
        subItems: [
          { label: 'Daily Sales', route: '/pos-layout/reports/daily' },
          { label: 'Stock Report', route: '/pos-layout/reports/stock' }
        ]
      },
      { label: 'Suppliers', icon: 'bi bi-truck', route: '/pos-layout/suppliers' },
      { label: 'Purchases', icon: 'bi bi-bag-check', route: '/pos-layout/purchases' },
    ];

    if (role === 'ADMIN') {
      return full;
    }
    if (role === 'MANAGER') {
      return full.filter(i => i.label !== 'Employees');
    }
    return full.filter(i =>
      i.label === 'Dashboard' || i.label === 'Sales' || i.label === 'Customers' || i.label==='Inventory'
    );
  });

  constructor(
    private router: Router,
    public authService: AuthService
  ) { }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
    if (this.isCollapsed()) {
      this.openMenuKey.set(null);
    }
  }

  toggleSubMenu(label: string) {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
    }
    this.openMenuKey.update(k => (k === label ? null : label));
  }

  isSubMenuActive(item: MenuItem): boolean {
    if (!item.subItems) return false;
    return item.subItems.some(sub => this.router.url.includes(sub.route));
  }

  logout() {
    this.authService.logout();
  }

  getRoleColor(): string {
  const role = this.authService.currentUser()?.role ?? 'CASHIER';
  if (role === 'ADMIN') return '#1a73e8';
  if (role === 'MANAGER') return '#2e7d32';
  return '#7b1fa2';
}

getRoleBg(): string {
  const role = this.authService.currentUser()?.role ?? 'CASHIER';
  if (role === 'ADMIN') return '#e8f4fd';
  if (role === 'MANAGER') return '#e8f5e9';
  return '#f3e5f5';
}

getRoleIcon(): string {
  const role = this.authService.currentUser()?.role ?? 'CASHIER';
  if (role === 'ADMIN') return 'bi-shield-lock-fill';
  if (role === 'MANAGER') return 'bi-person-workspace';
  return 'bi-cash-register';
}
}
