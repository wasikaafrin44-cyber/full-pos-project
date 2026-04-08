import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService, EmployeeRole } from '../shared/services/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Employee Roles</h2>
          <p class="text-muted small">Manage access levels and permissions</p>
        </div>
        <button class="btn btn-primary d-flex align-items-center gap-2" (click)="openAddModal()">
          <i class="bi bi-shield-lock"></i>
          Add New Role
        </button>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small text-uppercase">
              <tr>
                <th class="px-4 py-3">ID</th>
                <th class="px-4 py-3">Role Name</th>
                <th>Description</th>
                <th class="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (role of roleService.roles(); track role.id) {
                <tr>
                  <td class="px-4 fw-bold text-secondary">#{{ role.id }}</td>
                  <td class="px-4"><div class="fw-bold text-primary">{{ role.name }}</div></td>
                  <td>{{ role.description }}</td>
                  <td class="text-end px-4">
                    <button class="btn btn-icon btn-light me-2" (click)="openEditModal(role)">
                      <i class="bi bi-pencil-square text-primary"></i>
                    </button>
                    <button class="btn btn-icon btn-light" (click)="deleteRole(role.id)">
                      <i class="bi bi-trash text-danger"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="text-center py-5 text-muted">
                    <i class="bi bi-shield fs-1 d-block mb-3 opacity-25"></i>
                    No roles created yet
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
              <h5 class="fw-bold m-0">{{ isEditing() ? 'Edit Role' : 'Add New Role' }}</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body p-4">
              <form (ngSubmit)="saveRole()">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted text-uppercase">Role Name</label>
                  <input type="text" class="form-control" [(ngModel)]="currentRole.name" name="name" required>
                </div>
                <div class="mb-4">
                  <label class="form-label small fw-bold text-muted text-uppercase">Description</label>
                  <textarea class="form-control" [(ngModel)]="currentRole.description" name="description" rows="3"></textarea>
                </div>
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary py-2 fw-bold">
                    {{ isEditing() ? 'Update Role' : 'Save Role' }}
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
export class RolesComponent implements OnInit {
  showModal = signal(false);
  isEditing = signal(false);
  currentRole: EmployeeRole = { id: 0, name: '', description: '', permissions: [] };

  constructor(public roleService: RoleService) { }

  ngOnInit() { }

  openAddModal() {
    this.isEditing.set(false);
    this.currentRole = { id: 0, name: '', description: '', permissions: [] };
    this.showModal.set(true);
  }

  openEditModal(role: EmployeeRole) {
    this.isEditing.set(true);
    this.currentRole = { ...role };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveRole() {
    if (this.isEditing()) {
      this.roleService.updateRole(this.currentRole).subscribe(() => { this.closeModal(); });
    } else {
      this.roleService.addRole(this.currentRole).subscribe(() => { this.closeModal(); });
    }
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe();
    }
  }
}
