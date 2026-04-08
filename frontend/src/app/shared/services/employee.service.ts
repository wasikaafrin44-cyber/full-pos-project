import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface Employee {
    id: number;
    name: string;
    role: string;
    outlet: string;
    email: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private readonly STORAGE_KEY = 'pos_employees';
    private readonly API_URL = `${API_BASE_URL}/employees`;

    private employeesSignal = signal<Employee[]>([]);
    employees = this.employeesSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getEmployees().subscribe();
    }

    getEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(this.API_URL).pipe(
            tap(employees => this.updateState(employees)),
            catchError(() => {
                const local = StorageUtil.getItem<Employee[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    addEmployee(employee: Employee): Observable<Employee> {
        return this.http.post<Employee>(this.API_URL, employee).pipe(
            tap(() => this.getEmployees().subscribe()),
            catchError(() => {
                const employees = StorageUtil.getItem<Employee[]>(this.STORAGE_KEY, []);
                const maxId = employees.length > 0 ? Math.max(...employees.map(e => Number(e.id) || 0)) : 0;
                const newEmployee: Employee = { ...employee, id: maxId + 1 };
                const updated = [...employees, newEmployee];
                this.updateState(updated);
                return of(newEmployee);
            })
        );
    }

    updateEmployee(employee: Employee): Observable<Employee> {
        return this.http.put<Employee>(`${this.API_URL}/${employee.id}`, employee).pipe(
            tap(() => this.getEmployees().subscribe()),
            catchError(() => {
                const employees = StorageUtil.getItem<Employee[]>(this.STORAGE_KEY, []);
                const index = employees.findIndex(e => e.id === employee.id);
                if (index !== -1) {
                    employees[index] = { ...employee };
                    this.updateState(employees);
                }
                return of(employee);
            })
        );
    }

    deleteEmployee(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getEmployees().subscribe()),
            map(() => true),
            catchError(() => {
                const employees = StorageUtil.getItem<Employee[]>(this.STORAGE_KEY, []);
                const updated = employees.filter(e => e.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    private updateState(employees: Employee[]) {
        StorageUtil.setItem(this.STORAGE_KEY, employees);
        this.employeesSignal.set(employees);
    }
}
