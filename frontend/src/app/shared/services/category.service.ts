import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { StorageUtil } from '../utils/storage.util';
import { API_BASE_URL } from '../constants/api-url';

export interface Category {
  id ?: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly STORAGE_KEY = 'pos_categories';
    private readonly API_URL = 'http://localhost:8080/api/categories'; 

  private categoriesSignal = signal<Category[]>([]);
  categories = this.categoriesSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.getCategories().subscribe();
  }

  // Fetch all categories from backend
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.API_URL).pipe(
      tap(cats => this.updateState(cats)),
      catchError(() => {
        const local = StorageUtil.getItem<Category[]>(this.STORAGE_KEY, []);
        this.updateState(local);
        return of(local);
      })
    );
  }

  // Add new category
  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.API_URL, category).pipe(
      tap(() => this.getCategories().subscribe()), // refresh signal
      catchError(() => {
        const categories = StorageUtil.getItem<Category[]>(this.STORAGE_KEY, []);
        const maxId = categories.length > 0 ? Math.max(...categories.map(c => Number(c.id) || 0)) : 0;
        const newCategory: Category = { ...category, id: maxId + 1 };
        const updated = [...categories, newCategory];
        this.updateState(updated);
        return of(newCategory);
      })
    );
  }

  // Update category
  updateCategory(category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.API_URL}/${category.id}`, category).pipe(
      tap(() => this.getCategories().subscribe()), // refresh signal
      catchError(() => {
        const categories = StorageUtil.getItem<Category[]>(this.STORAGE_KEY, []);
        const index = categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          categories[index] = { ...category };
          this.updateState(categories);
        }
        return of(category);
      })
    );
  }

  // Delete category
  deleteCategory(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.getCategories().subscribe()),
      map(() => true),
      catchError(() => {
        const categories = StorageUtil.getItem<Category[]>(this.STORAGE_KEY, []);
        const updated = categories.filter(c => c.id !== id);
        this.updateState(updated);
        return of(true);
      })
    );
  }

  private updateState(categories: Category[]) {
    StorageUtil.setItem(this.STORAGE_KEY, categories);
    this.categoriesSignal.set(categories);
  }
}