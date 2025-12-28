import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User, ProfileUpdateRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditing: boolean = false;
  
  profileForm: ProfileUpdateRequest = {
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: ''
  };
  
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          mobileNumber: user.mobileNumber || ''
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile';
        this.isLoading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      // Reset form to current values
      this.profileForm = {
        firstName: this.user?.firstName || '',
        lastName: this.user?.lastName || '',
        email: this.user?.email || '',
        mobileNumber: this.user?.mobileNumber || ''
      };
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.updateProfile(this.profileForm).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isEditing = false;
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        
        // Update auth service if email or username changed
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          currentUser.email = updatedUser.email;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || 'Failed to update profile';
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileForm = {
      firstName: this.user?.firstName || '',
      lastName: this.user?.lastName || '',
      email: this.user?.email || '',
      mobileNumber: this.user?.mobileNumber || ''
    };
    this.errorMessage = '';
  }

  getStatusBadgeClass(): string {
    if (this.user?.status === 'ACTIVE') {
      return 'status-badge active';
    }
    return 'status-badge inactive';
  }
}
