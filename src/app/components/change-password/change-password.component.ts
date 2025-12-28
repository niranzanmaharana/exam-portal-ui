import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, PasswordChangeRequest } from '../../services/user.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {
  passwordForm: PasswordChangeRequest = {
    currentPassword: '',
    newPassword: ''
  };

  confirmPassword: string = '';
  
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    if (!this.passwordForm.currentPassword) {
      this.errorMessage = 'Current password is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.changePassword(this.passwordForm).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Password changed successfully!';
        
        // Clear form
        this.passwordForm = {
          currentPassword: '',
          newPassword: ''
        };
        this.confirmPassword = '';
        
        // Redirect to profile after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || 'Failed to change password. Please check your current password.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }
}
