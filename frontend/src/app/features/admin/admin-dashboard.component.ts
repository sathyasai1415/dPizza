import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { Store } from '../../shared/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 space-y-8">
      <div>
        <h2 class="text-3xl font-black text-white">Platform Administration</h2>
        <p class="text-xs sm:text-sm text-white/50">Manage restaurant partnership listings, approve registrations, and delete shops.</p>
      </div>

      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
      </div>

      <!-- SUCCESS / ERROR ALERTS -->
      <div *ngIf="successMsg()" class="bg-green-500/15 border border-green-500/30 text-green-300 p-4 rounded-xl text-xs font-medium">
        {{ successMsg() }}
      </div>

      <!-- PARTNERS TABLE -->
      <div *ngIf="!loading()" class="glass rounded-[2rem] overflow-hidden">
        <div *ngIf="restaurants().length === 0" class="p-8 text-center text-white/40 text-sm">
          No registered partner restaurants found.
        </div>

        <table *ngIf="restaurants().length > 0" class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-white/10 bg-white/5">
              <th class="p-4 font-bold text-white/50">Restaurant Name</th>
              <th class="p-4 font-bold text-white/50">Location / City</th>
              <th class="p-4 font-bold text-white/50">Contact Email</th>
              <th class="p-4 font-bold text-white/50">Status</th>
              <th class="p-4 font-bold text-white/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let shop of restaurants()" class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="p-4 font-bold text-white text-sm">
                {{ shop.name }}
              </td>
              <td class="p-4 text-white/70">{{ shop.addressLine }}, {{ shop.city }}</td>
              <td class="p-4 text-white/50">{{ shop.email }}</td>
              <td class="p-4">
                <span [class]="shop.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
                  class="px-2.5 py-1 rounded-full font-black uppercase tracking-wider text-[9px]">
                  {{ shop.approved ? 'Active / Approved' : 'Pending Review' }}
                </span>
              </td>
              <td class="p-4 text-right space-x-2">
                <button *ngIf="!shop.approved" (click)="approve(shop.id)"
                  class="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                  Approve
                </button>
                <button (click)="reject(shop.id)"
                  class="bg-red-600/25 border border-red-500/30 hover:bg-red-600 text-red-300 hover:text-white font-bold px-3 py-1.5 rounded-xl transition text-[10px]">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  restaurants = signal<Store[]>([]);
  loading = signal(true);
  successMsg = signal('');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.adminService.getAllRestaurants().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  approve(id: string) {
    this.adminService.approveRestaurant(id).subscribe({
      next: () => {
        this.successMsg.set('Restaurant approved successfully.');
        this.loadData();
      }
    });
  }

  reject(id: string) {
    if (confirm('Are you sure you want to delete this restaurant partnership listing?')) {
      this.adminService.rejectRestaurant(id).subscribe({
        next: () => {
          this.successMsg.set('Restaurant partnership removed.');
          this.loadData();
        }
      });
    }
  }
}
