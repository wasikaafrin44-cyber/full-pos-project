import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../shared/services/employee.service';
import { RoleService, EmployeeRole } from '../shared/services/role.service';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './employees.html',
})
export class EmployeesComponent implements OnInit {
    // Signals
    showModal = signal(false);
    isEditing = signal(false);
    currentEmployee: Employee = { id: 0, name: '', role: 'Staff', outlet: '', email: '' };

    constructor(
        public employeeService: EmployeeService,
        public roleService: RoleService
    ) { }

    ngOnInit(): void { }

    openAddModal() {
        this.isEditing.set(false);
        this.currentEmployee = { id: 0, name: '', role: 'Staff', outlet: '', email: '' };
        this.showModal.set(true);
    }

    openEditModal(employee: Employee) {
        this.isEditing.set(true);
        this.currentEmployee = { ...employee };
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
    }

    saveEmployee() {
        if (this.isEditing()) {
            this.employeeService.updateEmployee(this.currentEmployee).subscribe(() => {
                this.closeModal();
            });
        } else {
            this.employeeService.addEmployee(this.currentEmployee).subscribe(() => {
                this.closeModal();
            });
        }
    }

    deleteEmployee(id: number) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            this.employeeService.deleteEmployee(id).subscribe();
        }
    }
}
