import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="d-flex vh-100">
      <app-sidebar></app-sidebar>
      <div class="flex-grow-1 p-4" style="overflow-y: auto;">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: []
})
export class PosLayoutComponent { }
