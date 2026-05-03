import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface OrderItem {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: number;
    customerName: string;
    customerId?: number | null;
    date: string | Date;
    status: 'Pending' | 'Completed' | 'Cancelled';
    subtotal?: number;
    discount?: number;
    tax?: number;
    finalTotal?: number;
    total: number;
    paymentMethod?: string;
    items: OrderItem[];
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly STORAGE_KEY = 'pos_orders';
    private readonly API_URL = `${API_BASE_URL}/orders`;

    private ordersSignal = signal<Order[]>([]);
    orders = this.ordersSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getOrders().subscribe();
    }

    getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(this.API_URL).pipe(
            tap(orders => this.updateState(orders)),
            catchError(() => {
                const local = StorageUtil.getItem<Order[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    createOrder(order: Order): Observable<Order> {
        return this.http.post<Order>(this.API_URL, order).pipe(
            tap(() => this.getOrders().subscribe()),
            catchError(() => {
                const orders = StorageUtil.getItem<Order[]>(this.STORAGE_KEY, []);
                const maxId = orders.length > 0 ? Math.max(...orders.map(o => Number(o.id) || 0)) : 0;
                const newOrder: Order = { ...order, id: maxId + 1 };
                const updated = [...orders, newOrder];
                this.updateState(updated);
                return of(newOrder);
            })
        );
    }

    updateOrderStatus(id: number, status: 'Pending' | 'Completed' | 'Cancelled'): void {
        this.http.patch<Order>(`${this.API_URL}/${id}/status`, { status }).pipe(
            tap(() => this.getOrders().subscribe()),
            catchError(() => {
                const orders = StorageUtil.getItem<Order[]>(this.STORAGE_KEY, []);
                const index = orders.findIndex(o => o.id === id);
                if (index !== -1) {
                    orders[index] = { ...orders[index], status };
                    this.updateState(orders);
                }
                return of(null);
            })
        ).subscribe();
    }

    private updateState(orders: Order[]) {
        StorageUtil.setItem(this.STORAGE_KEY, orders);
        this.ordersSignal.set(orders);
    }
}
