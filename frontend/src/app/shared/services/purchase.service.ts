import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface PurchaseItem {
    productId: number;
    productName: string;
    quantity: number;
    purchasePrice: number;
}

export interface Purchase {
    id: number;
    supplierId: number;
    supplierName?: string;
    date: any; // ✅ use any to handle both Date and string from backend
    totalAmount: number;
    status: 'Received' | 'Pending' | 'Ordered';
    items: PurchaseItem[];
}

@Injectable({
    providedIn: 'root'
})
export class PurchaseService {
    private readonly STORAGE_KEY = 'pos_purchases';
    private readonly API_URL = 'http://localhost:8080/api/purchases'; // ✅

    private purchasesSignal = signal<Purchase[]>([]);
    purchases = this.purchasesSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getPurchases().subscribe();
    }

    getPurchases(): Observable<Purchase[]> {
        return this.http.get<Purchase[]>(this.API_URL).pipe(
            tap(purchases => this.updateState(purchases)),
            catchError(() => {
                const local = StorageUtil.getItem<Purchase[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    addPurchase(purchase: Purchase): Observable<Purchase> {
        return this.http.post<Purchase>(this.API_URL, purchase).pipe(
            tap(() => this.getPurchases().subscribe()),
            catchError(() => {
                const purchases = StorageUtil.getItem<Purchase[]>(this.STORAGE_KEY, []);
                const maxId = purchases.length > 0 ? Math.max(...purchases.map(p => Number(p.id) || 0)) : 0;
                const newPurchase: Purchase = { ...purchase, id: maxId + 1 };
                const updated = [...purchases, newPurchase];
                this.updateState(updated);
                return of(newPurchase);
            })
        );
    }

    deletePurchase(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getPurchases().subscribe()),
            map(() => true),
            catchError(() => {
                const purchases = StorageUtil.getItem<Purchase[]>(this.STORAGE_KEY, []);
                const updated = purchases.filter(p => p.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    private updateState(purchases: Purchase[]) {
    const normalized = purchases.map(p => ({
        ...p,
        id: Number(p.id),
        supplierId: Number(p.supplierId),
        totalAmount: Number(p.totalAmount),
        items: p.items || []
    }));
    StorageUtil.setItem(this.STORAGE_KEY, normalized);
    this.purchasesSignal.set(normalized);
}
}
