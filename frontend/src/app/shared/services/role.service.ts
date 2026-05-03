import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageUtil } from '../utils/storage.util';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { API_BASE_URL } from '../constants/api-url';

export interface EmployeeRole {
    id: number;
    name: string;
    description: string;
    permissions: string[];
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private readonly STORAGE_KEY = 'pos_roles';
    private readonly API_URL = `${API_BASE_URL}/roles`;

    private rolesSignal = signal<EmployeeRole[]>([]);
    roles = this.rolesSignal.asReadonly();

    constructor(private http: HttpClient) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.getRoles().subscribe();
    }

    getRoles(): Observable<EmployeeRole[]> {
        return this.http.get<EmployeeRole[]>(this.API_URL).pipe(
            tap(roles => this.updateState(roles)),
            catchError(() => {
                const local = StorageUtil.getItem<EmployeeRole[]>(this.STORAGE_KEY, []);
                this.updateState(local);
                return of(local);
            })
        );
    }

    addRole(role: EmployeeRole): Observable<EmployeeRole> {
        return this.http.post<EmployeeRole>(this.API_URL, role).pipe(
            tap(() => this.getRoles().subscribe()),
            catchError(() => {
                const roles = StorageUtil.getItem<EmployeeRole[]>(this.STORAGE_KEY, []);
                const maxId = roles.length > 0 ? Math.max(...roles.map(r => Number(r.id) || 0)) : 0;
                const newRole: EmployeeRole = { ...role, id: maxId + 1 };
                const updated = [...roles, newRole];
                this.updateState(updated);
                return of(newRole);
            })
        );
    }

    updateRole(role: EmployeeRole): Observable<EmployeeRole> {
        return this.http.put<EmployeeRole>(`${this.API_URL}/${role.id}`, role).pipe(
            tap(() => this.getRoles().subscribe()),
            catchError(() => {
                const roles = StorageUtil.getItem<EmployeeRole[]>(this.STORAGE_KEY, []);
                const index = roles.findIndex(r => r.id === role.id);
                if (index !== -1) {
                    roles[index] = { ...role };
                    this.updateState(roles);
                }
                return of(role);
            })
        );
    }

    deleteRole(id: number): Observable<boolean> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.getRoles().subscribe()),
            map(() => true),
            catchError(() => {
                const roles = StorageUtil.getItem<EmployeeRole[]>(this.STORAGE_KEY, []);
                const updated = roles.filter(r => r.id !== id);
                this.updateState(updated);
                return of(true);
            })
        );
    }

    private updateState(roles: EmployeeRole[]) {
        StorageUtil.setItem(this.STORAGE_KEY, roles);
        this.rolesSignal.set(roles);
    }
}
