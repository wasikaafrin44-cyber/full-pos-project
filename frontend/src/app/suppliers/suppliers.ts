import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../shared/services/supplier.service';
import { CategoryService } from '../shared/services/category.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Supplier Management</h2>
          <p class="text-muted small">Manage your product vendors and procurement</p>
        </div>
        <button class="btn btn-primary d-flex align-items-center gap-2" (click)="openAddModal()">
          <i class="bi bi-truck"></i>
          Add New Supplier
        </button>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Category</th>
                <th>Contact Info</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (supplier of supplierService.suppliers(); track supplier.id) {
                <tr>
                  <td class="fw-bold text-secondary">#{{ supplier.id }}</td>
                  <td><div class="fw-bold">{{ supplier.name }}</div></td>
                  <td>{{ supplier.contactPerson }}</td>
                  <td><span class="badge bg-secondary-subtle text-secondary">{{ supplier.category }}</span></td>
                  <td>
                    <div class="small">{{ supplier.email }}</div>
                    <div class="small text-muted">{{ supplier.phone }}</div>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-icon text-primary me-2" (click)="openEditModal(supplier)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-icon text-danger" (click)="deleteSupplier(supplier.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-5 text-muted">No suppliers found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (showModal()) {
      <div class="modal d-block" tabindex="-1">
        <div class="modal-backdrop show" (click)="closeModal()"></div>
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold">{{ isEditing() ? 'Edit Supplier' : 'Add New Supplier' }}</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">SUPPLIER NAME</label>
                  <input type="text" class="form-control"
                    [ngModel]="currentSupplier().name"
                    (ngModelChange)="currentSupplier.set({...currentSupplier(), name: $event})"
                    name="name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">CONTACT PERSON</label>
                  <input type="text" class="form-control"
                    [ngModel]="currentSupplier().contactPerson"
                    (ngModelChange)="currentSupplier.set({...currentSupplier(), contactPerson: $event})"
                    name="contactPerson">
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">EMAIL</label>
                  <input type="email" class="form-control"
                    [ngModel]="currentSupplier().email"
                    (ngModelChange)="currentSupplier.set({...currentSupplier(), email: $event})"
                    name="email">
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label small fw-bold text-muted">PHONE</label>
                    <input type="text" class="form-control"
                      [ngModel]="currentSupplier().phone"
                      (ngModelChange)="currentSupplier.set({...currentSupplier(), phone: $event})"
                      name="phone">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label small fw-bold text-muted">CATEGORY</label>

                    <!-- ✅ Dynamic from CategoryService -->
                    <select class="form-select"
                      [ngModel]="currentSupplier().category"
                      (ngModelChange)="currentSupplier.set({...currentSupplier(), category: $event})"
                      name="category">
                      <option value="" disabled>Select Category</option>
                      @for (cat of categoryService.categories(); track cat.id) {
                        @if (cat.status === 'Active') {
                          <option [value]="cat.name">{{ cat.name }}</option>
                        }
                      }
                    </select>

                    @if (categoryService.categories().length === 0) {
                      <div class="small text-danger mt-1">
                        <i class="bi bi-exclamation-circle me-1"></i>
                        No categories found. Add categories first.
                      </div>
                    }

                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 pt-0">
              <button type="button" class="btn btn-light" (click)="closeModal()">Cancel</button>
              <button type="button" class="btn btn-primary px-4" (click)="saveSupplier()">
                {{ isEditing() ? 'Update Supplier' : 'Save Supplier' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SuppliersComponent implements OnInit {
  showModal = signal(false);
  isEditing = signal(false);
  currentSupplier = signal<Supplier>({
    id: 0, name: '', contactPerson: '', email: '', phone: '', category: ''
  });

  constructor(
    public supplierService: SupplierService,
    public categoryService: CategoryService  // ✅ injected
  ) { }

  ngOnInit() { }

  openAddModal() {
    this.isEditing.set(false);
    this.currentSupplier.set({
      id: 0, name: '', contactPerson: '', email: '', phone: '', category: ''
    });
    this.showModal.set(true);
  }

  openEditModal(supplier: Supplier) {
    this.isEditing.set(true);
    this.currentSupplier.set({ ...supplier });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveSupplier() {
    const supplier = this.currentSupplier();
    if (this.isEditing()) {
      this.supplierService.updateSupplier(supplier).subscribe(() => this.closeModal());
    } else {
      this.supplierService.addSupplier(supplier).subscribe(() => this.closeModal());
    }
  }

  deleteSupplier(id: number) {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.supplierService.deleteSupplier(id).subscribe();
    }
  }
}