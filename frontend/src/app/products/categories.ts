import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../shared/services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Product Categories</h2>
          <p class="text-muted small mb-0">Manage your product categories</p>
        </div>
        <button class="btn d-flex align-items-center gap-2 px-4 py-2 fw-semibold"
          style="background-color:#e8f4fd; color:#1a73e8; border:none; border-radius:12px;"
          (click)="openAddModal()">
          <i class="bi bi-plus-lg"></i> Add Category
        </button>
      </div>

      <!-- Search -->
      <div class="card border-0 shadow-sm mb-4 p-3" style="border-radius:16px;">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">
            <i class="bi bi-search text-muted"></i>
          </span>
          <input type="text" class="form-control border-start-0"
            placeholder="Search categories..."
            [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)">
        </div>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm" style="border-radius:16px;">
        <div class="card-header border-0 px-4 pt-4 pb-3 d-flex justify-content-between align-items-center"
          style="background: linear-gradient(135deg, #e8f5e9, #ffffff); border-radius:16px 16px 0 0;">
          <div>
            <h5 class="fw-bold mb-1" style="color:#2e7d32;">Categories List</h5>
            <p class="small mb-0" style="color:#66bb6a;">{{ filteredCategories().length }} categories found</p>
          </div>
          <span class="badge rounded-pill px-3 py-2"
            style="background-color:#c8e6c9; color:#1b5e20;">
            {{ filteredCategories().length }} total
          </span>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="small text-uppercase"
              style="background-color:#f1f8e9; color:#558b2f;">
              <tr>
                <th class="px-4 py-3">#ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th class="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of filteredCategories(); track cat.id) {
              <tr>
                <td class="px-4">
                  <span class="fw-bold" style="color:#1a73e8;">#{{ cat.id }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold small"
                      style="width:34px;height:34px;min-width:34px;background-color:#e8f5e9;color:#2e7d32;">
                      {{ cat.name[0].toUpperCase() }}
                    </div>
                    <span class="fw-semibold">{{ cat.name }}</span>
                  </div>
                </td>
                <td class="text-muted small">{{ cat.description || '—' }}</td>
                <td>
                  <span class="badge rounded-pill px-3 py-2"
                    [style.background-color]="cat.status === 'Active' ? '#e8f5e9' : '#fce4ec'"
                    [style.color]="cat.status === 'Active' ? '#2e7d32' : '#c62828'">
                    {{ cat.status }}
                  </span>
                </td>
                <td class="text-end px-4">
                  <button class="btn btn-sm me-2 fw-semibold"
                    style="background-color:#e8f4fd; color:#1a73e8; border:none; border-radius:8px;"
                    (click)="openEditModal(cat)">
                    <i class="bi bi-pencil-square me-1"></i>Edit
                  </button>
                  <button class="btn btn-sm fw-semibold"
                    style="background-color:#fce4ec; color:#c62828; border:none; border-radius:8px;"
                    (click)="deleteCategory(cat.id)">
                    <i class="bi bi-trash me-1"></i>Delete
                  </button>
                </td>
              </tr>
              } @empty {
              <tr>
                <td colspan="5" class="text-center py-5 text-muted">
                  <i class="bi bi-folder-x fs-1 d-block mb-3 opacity-25"></i>
                  No categories found.
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
    <div class="modal d-block" tabindex="-1" style="z-index:1055;">
      <div class="modal-backdrop show" style="z-index:1054;" (click)="closeModal()"></div>
      <div class="modal-dialog modal-dialog-centered" style="z-index:1056;">
        <div class="modal-content border-0 shadow-lg" style="border-radius:20px;">

          <!-- Modal Header -->
          <div class="modal-header border-0 px-4 pt-4 pb-0">
            <div>
              <h5 class="fw-bold mb-1">{{ isEditing() ? 'Edit Category' : 'Add New Category' }}</h5>
              <p class="text-muted small mb-0">{{ isEditing() ? 'Update category details' : 'Fill in the details below' }}</p>
            </div>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body p-4">
            <form (ngSubmit)="saveCategory()">

              <div class="mb-3">
                <label class="form-label small fw-semibold text-uppercase text-muted">Category Name</label>
                <input type="text" class="form-control"
                  style="border-radius:10px;"
                  [(ngModel)]="currentCategory.name"
                  name="name" placeholder="e.g. Electronics" required>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-uppercase text-muted">Description</label>
                <input type="text" class="form-control"
                  style="border-radius:10px;"
                  [(ngModel)]="currentCategory.description"
                  name="description" placeholder="Short description...">
              </div>

              <div class="mb-4">
                <label class="form-label small fw-semibold text-uppercase text-muted">Status</label>
                <select class="form-select" style="border-radius:10px;"
                  [(ngModel)]="currentCategory.status" name="status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn py-2 fw-bold"
                  style="background-color:#e8f5e9; color:#2e7d32; border:none; border-radius:12px;">
                  <i class="bi bi-check-lg me-1"></i>
                  {{ isEditing() ? 'Update Category' : 'Save Category' }}
                </button>
                <button type="button" class="btn py-2"
                  style="background-color:#f5f5f5; color:#555; border:none; border-radius:12px;"
                  (click)="closeModal()">
                  Cancel
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
    }
  `
})
export class CategoriesComponent implements OnInit {
  searchQuery = signal('');
  showModal = signal(false);
  isEditing = signal(false);
  currentCategory: Category = { name: '', description: '', status: 'Active' };

  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.categoryService.categories()
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
  });

  constructor(public categoryService: CategoryService) {}

  ngOnInit() {}

  openAddModal() {
    this.isEditing.set(false);
    this.currentCategory = { name: '', description: '', status: 'Active' };
    this.showModal.set(true);
  }

  openEditModal(cat: Category) {
    this.isEditing.set(true);
    this.currentCategory = { ...cat };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveCategory() {
    if (this.isEditing()) {
      this.categoryService.updateCategory(this.currentCategory).subscribe(() => this.closeModal());
    } else {
      const { id, ...categoryWithoutId } = this.currentCategory as any;
      this.categoryService.addCategory(categoryWithoutId).subscribe(() => this.closeModal());
    }
  }

  deleteCategory(id?: number) {
    if (id && confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(id).subscribe();
    }
  }
}