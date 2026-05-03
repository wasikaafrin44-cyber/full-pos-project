import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    type: 'Regular' | 'New' | 'Membership';
    joinDate: Date;
    loyaltyPoints: number;
}

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private readonly STORAGE_KEY = 'pos_customers';
    private readonly API_URL = `${API_BASE_URL}/customers`;

    private customersSignal = signal<Customer[]>([]);
    customers = this.customersSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getCustomers().subscribe();
    }

    getCustomers(): Observable<Customer[]> {
        return this.http.get<Customer[]>(this.API_URL).pipe(
            tap(customers => this.updateState(customers)),
            catchError(() => {
                const local = StorageUtil.getItem<Customer[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    addCustomer(customer: Customer): Observable<Customer> {
        return this.http.post<Customer>(this.API_URL, customer).pipe(
            tap(() => this.getCustomers().subscribe()),
            catchError(() => {
                const customers = StorageUtil.getItem<Customer[]>(this.STORAGE_KEY, []);
                const maxId = customers.length > 0 ? Math.max(...customers.map(c => Number(c.id) || 0)) : 0;
                const newCustomer: Customer = { ...customer, id: maxId + 1 };
                const updated = [...customers, newCustomer];
                this.updateState(updated);
                return of(newCustomer);
            })
        );
    }

    updateCustomer(customer: Customer): Observable<Customer> {
        return this.http.put<Customer>(`${this.API_URL}/${customer.id}`, customer).pipe(
            tap(() => this.getCustomers().subscribe()),
            catchError(() => {
                const customers = StorageUtil.getItem<Customer[]>(this.STORAGE_KEY, []);
                const index = customers.findIndex(c => c.id === customer.id);
                if (index !== -1) {
                    customers[index] = { ...customer };
                    this.updateState(customers);
                }
                return of(customer);
            })
        );
    }

    deleteCustomer(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getCustomers().subscribe()),
            map(() => true),
            catchError(() => {
                const customers = StorageUtil.getItem<Customer[]>(this.STORAGE_KEY, []);
                const updated = customers.filter(c => c.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    private updateState(customers: Customer[]) {
        StorageUtil.setItem(this.STORAGE_KEY, customers);
        this.customersSignal.set(customers);
    }
}
