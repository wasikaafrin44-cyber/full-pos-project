import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface Supplier {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    category: string;
}

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private readonly STORAGE_KEY = 'pos_suppliers';
    private readonly API_URL = `${API_BASE_URL}/suppliers`;

    private suppliersSignal = signal<Supplier[]>([]);
    suppliers = this.suppliersSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getSuppliers().subscribe();
    }

    getSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(this.API_URL).pipe(
            tap(suppliers => this.updateState(suppliers)),
            catchError(() => {
                const local = StorageUtil.getItem<Supplier[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    addSupplier(supplier: Supplier): Observable<Supplier> {
        return this.http.post<Supplier>(this.API_URL, supplier).pipe(
            tap(() => this.getSuppliers().subscribe()),
            catchError(() => {
                const suppliers = StorageUtil.getItem<Supplier[]>(this.STORAGE_KEY, []);
                const maxId = suppliers.length > 0 ? Math.max(...suppliers.map(s => Number(s.id) || 0)) : 0;
                const newSupplier: Supplier = { ...supplier, id: maxId + 1 };
                const updated = [...suppliers, newSupplier];
                this.updateState(updated);
                return of(newSupplier);
            })
        );
    }

    updateSupplier(supplier: Supplier): Observable<Supplier> {
        return this.http.put<Supplier>(`${this.API_URL}/${supplier.id}`, supplier).pipe(
            tap(() => this.getSuppliers().subscribe()),
            catchError(() => {
                const suppliers = StorageUtil.getItem<Supplier[]>(this.STORAGE_KEY, []);
                const index = suppliers.findIndex(s => s.id === supplier.id);
                if (index !== -1) {
                    suppliers[index] = { ...supplier };
                    this.updateState(suppliers);
                }
                return of(supplier);
            })
        );
    }

    deleteSupplier(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getSuppliers().subscribe()),
            map(() => true),
            catchError(() => {
                const suppliers = StorageUtil.getItem<Supplier[]>(this.STORAGE_KEY, []);
                const updated = suppliers.filter(s => s.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    private updateState(suppliers: Supplier[]) {
        StorageUtil.setItem(this.STORAGE_KEY, suppliers);
        this.suppliersSignal.set(suppliers);
    }
}
