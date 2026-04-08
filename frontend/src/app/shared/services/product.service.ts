import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface Product {
    id: number;
    name: string;
    categoryId: number;
    brandId: number;
    category?: string; // For display
    brand?: string;    // For display
    price: number;
    stock: number;
    image?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private readonly STORAGE_KEY = 'pos_products';
    private readonly API_URL = 'http://localhost:8080/api/products';  // ✅ fixed

    // Using Signal for state management
    private productsSignal = signal<Product[]>([]);

    // Public readonly signal
    products = this.productsSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getProducts().subscribe();
    }

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.API_URL).pipe(
            tap(products => this.updateState(products)),
            catchError(() => {
                const local = StorageUtil.getItem<Product[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.API_URL}/${id}`).pipe(
            catchError(() => {
                const products = StorageUtil.getItem<Product[]>(this.STORAGE_KEY, []);
                const found = products.find(p => p.id === id)!;
                return of(found);
            })
        );
    }

    addProduct(product: Product): Observable<Product> {
        return this.http.post<Product>(this.API_URL, product).pipe(
            tap(() => this.getProducts().subscribe()),
            catchError(() => {
                const products = StorageUtil.getItem<Product[]>(this.STORAGE_KEY, []);
                const maxId = products.length > 0 ? Math.max(...products.map(p => Number(p.id) || 0)) : 0;
                const newProduct: Product = { ...product, id: maxId + 1 };
                const updated = [...products, newProduct];
                this.updateState(updated);
                return of(newProduct);
            })
        );
    }

    updateProduct(product: Product): Observable<Product> {
        return this.http.put<Product>(`${this.API_URL}/${product.id}`, product).pipe(
            tap(() => this.getProducts().subscribe()),
            catchError(() => {
                const products = StorageUtil.getItem<Product[]>(this.STORAGE_KEY, []);
                const index = products.findIndex(p => p.id === product.id);
                if (index !== -1) {
                    products[index] = { ...product };
                    this.updateState(products);
                }
                return of(product);
            })
        );
    }

    deleteProduct(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getProducts().subscribe()),
            map(() => true),
            catchError(() => {
                const products = StorageUtil.getItem<Product[]>(this.STORAGE_KEY, []);
                const updated = products.filter(p => p.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    adjustStock(id: number, delta: number): void {
        // Primary path: real backend when available
        this.http.patch<Product>(`${this.API_URL}/${id}/adjust-stock`, { delta }).pipe(
            tap(() => this.getProducts().subscribe()),
            catchError(() => {
                // Fallback: local stock adjustment
                const products = StorageUtil.getItem<Product[]>(this.STORAGE_KEY, []);
                const index = products.findIndex(p => p.id === id);
                if (index !== -1) {
                    const current = products[index];
                    products[index] = { ...current, stock: (current.stock || 0) + delta };
                    this.updateState(products);
                }
                return of(null);
            })
        ).subscribe();
    }

    private updateState(products: Product[]) {
        StorageUtil.setItem(this.STORAGE_KEY, products);
        this.productsSignal.set(products);
    }
}
