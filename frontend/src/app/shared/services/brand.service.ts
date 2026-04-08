import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';

export interface Brand {
    id: number;
    name: string;
    origin: string;
    status: 'Active' | 'Inactive';
}

@Injectable({
    providedIn: 'root'
})
export class BrandService {
    private readonly STORAGE_KEY = 'pos_brands';
    private readonly API_URL = 'http://localhost:8080/api/brands';  // ✅ fixed

    private brandsSignal = signal<Brand[]>([]);
    brands = this.brandsSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getBrands().subscribe();
    }

    getBrands(): Observable<Brand[]> {
        return this.http.get<Brand[]>(this.API_URL).pipe(
            tap(brands => this.updateState(brands)),
            catchError(() => {
                const local = StorageUtil.getItem<Brand[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    addBrand(brand: Omit<Brand, 'id'>): Observable<Brand> {
    return this.http.post<Brand>(this.API_URL, brand).pipe(
        tap(() => this.getBrands().subscribe()),
        catchError(() => {
            const brands = StorageUtil.getItem<Brand[]>(this.STORAGE_KEY, []);
            const maxId = brands.length > 0 ? Math.max(...brands.map(b => Number(b.id) || 0)) : 0;
            const newBrand: Brand = { ...brand, id: maxId + 1 };
            const updated = [...brands, newBrand];
            this.updateState(updated);
            return of(newBrand);
        })
    );
}

    updateBrand(brand: Brand): Observable<Brand> {
        return this.http.put<Brand>(`${this.API_URL}/${brand.id}`, brand).pipe(
            tap(() => this.getBrands().subscribe()),
            catchError(() => {
                const brands = StorageUtil.getItem<Brand[]>(this.STORAGE_KEY, []);
                const index = brands.findIndex(b => b.id === brand.id);
                if (index !== -1) {
                    brands[index] = { ...brand };
                    this.updateState(brands);
                }
                return of(brand);
            })
        );
    }

    deleteBrand(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getBrands().subscribe()),
            map(() => true),
            catchError(() => {
                const brands = StorageUtil.getItem<Brand[]>(this.STORAGE_KEY, []);
                const updated = brands.filter(b => b.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    searchBrands(filters: Partial<Pick<Brand, 'name' | 'origin' | 'status'>>): Observable<Brand[]> {
        const params: Record<string, string> = {};
        if (filters.name)   params['name']   = filters.name;
        if (filters.origin) params['origin'] = filters.origin;
        if (filters.status) params['status'] = filters.status;

        return this.http.get<Brand[]>(`${this.API_URL}/search`, { params }).pipe(
            tap(brands => this.updateState(brands)),
            catchError(() => {
                const local = StorageUtil.getItem<Brand[]>(this.STORAGE_KEY, []);
                const filtered = local.filter(b =>
                    (!filters.name   || b.name.toLowerCase().includes(filters.name.toLowerCase())) &&
                    (!filters.origin || b.origin.toLowerCase().includes(filters.origin.toLowerCase())) &&
                    (!filters.status || b.status === filters.status)
                );
                return of(filtered);
            })
        );
    }

    private updateState(brands: Brand[]) {
        StorageUtil.setItem(this.STORAGE_KEY, brands);
        this.brandsSignal.set(brands);
    }
}