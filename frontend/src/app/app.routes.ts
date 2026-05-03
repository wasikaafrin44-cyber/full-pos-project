import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { PosLayoutComponent } from './auth/pos-layout/pos-layout';
import { DashboardComponent } from './dashboard/dashboard';
import { ProductsComponent } from './products/products';
import { SalesComponent } from './orders/sales';
import { CustomersComponent } from './customers/customers';
import { EmployeesComponent } from './employees/employees';
import { SuppliersComponent } from './suppliers/suppliers';
import { PurchasesComponent } from './purchases/purchases';
import { SalesListComponent } from './orders/sales-list';
import { CategoriesComponent } from './products/categories';
import { BrandsComponent } from './products/brands';
import { RolesComponent } from './employees/roles';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: 'pos-layout',
    component: PosLayoutComponent,
    canMatch: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] }
      },

      {
  path: 'products',
  component: ProductsComponent,
  canMatch: [roleGuard],
  data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] } // ✅ added CASHIER
},
{
  path: 'inventory/categories',
  component: CategoriesComponent,
  canMatch: [roleGuard],
  data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] } // ✅ added CASHIER
},
{
  path: 'inventory/brands',
  component: BrandsComponent,
  canMatch: [roleGuard],
  data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] } // ✅ added CASHIER
},

      {
        path: 'sales/new',
        component: SalesComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] }
      },
      {
        path: 'sales/list',
        component: SalesListComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] }
      },

      {
        path: 'customers',
        component: CustomersComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER', 'CASHIER'] }
      },
      {
        path: 'employee/list',
        component: EmployeesComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'employee/roles',
        component: RolesComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'suppliers',
        component: SuppliersComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      },
      {
        path: 'purchases',
        component: PurchasesComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      },

      {
        path: 'reports/daily',
        component: DashboardComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      },
      {
        path: 'reports/stock',
        component: ProductsComponent,
        canMatch: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
