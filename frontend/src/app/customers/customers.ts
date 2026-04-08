import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../shared/services/customer.service';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customers.html',
})
export class CustomersComponent implements OnInit {
    showModal = signal(false);
    isEditing = signal(false);
    currentCustomer = signal<Customer>({ id: 0, name: '', email: '', phone: '', type: 'Regular', joinDate: new Date(), loyaltyPoints: 0 });

    constructor(public customerService: CustomerService) { }

    ngOnInit(): void {
        // Data is automatically loaded by the service
    }

    openAddModal() {
        this.isEditing.set(false);
        this.currentCustomer.set({ id: 0, name: '', email: '', phone: '', type: 'Regular', joinDate: new Date(), loyaltyPoints: 0 });
        this.showModal.set(true);
    }

    openEditModal(customer: Customer) {
        this.isEditing.set(true);
        this.currentCustomer.set({ ...customer });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
    }

    saveCustomer() {
        const customer = this.currentCustomer();
        if (this.isEditing()) {
            this.customerService.updateCustomer(customer).subscribe(() => {
                this.closeModal();
            });
        } else {
            this.customerService.addCustomer(customer).subscribe(() => {
                this.closeModal();
            });
        }
    }

    deleteCustomer(id: number) {
        if (confirm('Are you sure you want to delete this customer?')) {
            this.customerService.deleteCustomer(id).subscribe();
        }
    }
}
