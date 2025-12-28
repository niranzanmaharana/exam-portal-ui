import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-organizers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './organizers.component.html',
  styleUrl: './organizers.component.css'
})
export class OrganizersComponent implements OnInit {
  organizers: User[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrganizers();
  }

  loadOrganizers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.getAllOrganizers().subscribe({
      next: (organizers) => {
        this.organizers = organizers;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading organizers:', error);
        this.errorMessage = 'Failed to load organizers. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get filteredOrganizers(): User[] {
    if (!this.searchTerm.trim()) {
      return this.organizers;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.organizers.filter(organizer => 
      organizer.username?.toLowerCase().includes(term) ||
      organizer.email?.toLowerCase().includes(term) ||
      organizer.firstName?.toLowerCase().includes(term) ||
      organizer.lastName?.toLowerCase().includes(term) ||
      organizer.mobileNumber?.toLowerCase().includes(term)
    );
  }

  get totalOrganizers(): number {
    return this.organizers.length;
  }

  get activeOrganizers(): number {
    return this.organizers.filter(o => o.status === 'ACTIVE').length;
  }

  get inactiveOrganizers(): number {
    return this.organizers.filter(o => o.status === 'INACTIVE').length;
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (status === 'ACTIVE') {
      return 'status-badge active';
    }
    return 'status-badge inactive';
  }

  getInitials(organizer: User): string {
    if (organizer.firstName && organizer.lastName) {
      return (organizer.firstName.charAt(0) + organizer.lastName.charAt(0)).toUpperCase();
    }
    return organizer.username?.charAt(0).toUpperCase() || 'O';
  }

  getOrganizerName(organizer: User): string {
    if (organizer.firstName || organizer.lastName) {
      const name = ((organizer.firstName || '') + ' ' + (organizer.lastName || '')).trim();
      return name || 'N/A';
    }
    return 'N/A';
  }

  getUsernameWithAt(organizer: User): string {
    return '@' + (organizer.username || '');
  }
}
