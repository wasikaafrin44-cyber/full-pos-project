import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandService, Brand } from '../shared/services/brand.service';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Product Brands</h2>
          <p class="text-muted small">Manage manufacturers and brands</p>
        </div>
        <button class="btn btn-primary d-flex align-items-center gap-2" (click)="openAddModal()">
          <i class="bi bi-star"></i>
          Add New Brand
        </button>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row align-items-center">
            <div class="col-md-4">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light border-0"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control bg-light border-0" placeholder="Search brands..." 
                  [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small text-uppercase">
              <tr>
                <th class="px-4 py-3">Brand Name</th>
                <th>Origin</th>
                <th>Status</th>
                <th class="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (b of filteredBrands(); track b.id) {
                <tr>
                  <td class="px-4 fw-bold text-primary">{{ b.name }}</td>
                  <td>{{ b.origin }}</td>
                  <td>
                    <span class="badge rounded-pill px-3 py-2" 
                      [class.bg-info-subtle]="b.status === 'Active'" 
                      [class.text-info]="b.status === 'Active'"
                      [class.bg-secondary-subtle]="b.status === 'Inactive'"
                      [class.text-secondary]="b.status === 'Inactive'">
                      {{ b.status }}
                    </span>
                  </td>
                  <td class="text-end px-4">
                    <button class="btn btn-icon btn-light me-2" (click)="openEditModal(b)">
                      <i class="bi bi-pencil-square text-primary"></i>
                    </button>
                    <button class="btn btn-icon btn-light" (click)="deleteBrand(b.id)">
                      <i class="bi bi-trash text-danger"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="text-center py-5 text-muted">
                    <i class="bi bi-star fs-1 d-block mb-3 opacity-25"></i>
                    No brands found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="modal d-block" tabindex="-1">
        <div class="modal-backdrop show" (click)="closeModal()"></div>
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header border-0 pb-0 pt-4 px-4">
              <h5 class="fw-bold m-0">{{ isEditing() ? 'Edit Brand' : 'Add New Brand' }}</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body p-4">
              <form (ngSubmit)="saveBrand()">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted text-uppercase">Name</label>
                  <input type="text" class="form-control" [(ngModel)]="currentBrand.name" name="name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted text-uppercase">Origin</label>
                  <input type="text" class="form-control" [(ngModel)]="currentBrand.origin" name="origin">
                </div>
                <div class="mb-4">
                  <label class="form-label small fw-bold text-muted text-uppercase">Status</label>
                  <select class="form-select" [(ngModel)]="currentBrand.status" name="status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary py-2 fw-bold">
                    {{ isEditing() ? 'Update Brand' : 'Save Brand' }}
                  </button>
                  <button type="button" class="btn btn-light py-2" (click)="closeModal()">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class BrandsComponent implements OnInit {
  searchQuery = signal('');
  showModal = signal(false);
  isEditing = signal(false);
  currentBrand: Brand = { id: 0, name: '', origin: '', status: 'Active' };

  filteredBrands = computed(() => {
    const brands = this.brandService.brands();
    const query = this.searchQuery().toLowerCase();
    if (!query) return brands;
    return brands.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.origin.toLowerCase().includes(query)
    );
  });

  constructor(public brandService: BrandService) { }

  ngOnInit() { }

  openAddModal() {
    this.isEditing.set(false);
    this.currentBrand = { id: 0, name: '', origin: '', status: 'Active' };
    this.showModal.set(true);
  }

  openEditModal(brand: Brand) {
    this.isEditing.set(true);
    this.currentBrand = { ...brand };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveBrand() {
    if (this.isEditing()) {
        this.brandService.updateBrand(this.currentBrand).subscribe(() => { this.closeModal(); });
    } else {
        const { id, ...brandWithoutId } = this.currentBrand;  // ✅ strip id before sending
        this.brandService.addBrand(brandWithoutId).subscribe(() => { this.closeModal(); });
    }
}

  deleteBrand(id: number) {
    if (confirm('Are you sure you want to delete this brand?')) {
      this.brandService.deleteBrand(id).subscribe();
    }
  }
}
