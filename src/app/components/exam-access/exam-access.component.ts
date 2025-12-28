import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, Exam, ExamAccessRequest } from '../../services/exam.service';
import { ExamSessionService } from '../../services/exam-session.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-access.component.html',
  styleUrl: './exam-access.component.css'
})
export class ExamAccessComponent implements OnInit {
  accessCode: string = '';
  exam: Exam | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  isAccessing: boolean = false;

  // Captcha
  captchaText: string = '';
  captchaInput: string = '';
  captchaError: string = '';

  constructor(
    private examService: ExamService,
    private examSessionService: ExamSessionService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Generate captcha
    this.generateCaptcha();

    this.route.params.subscribe(params => {
      this.accessCode = params['code'] || '';
      if (this.accessCode) {
        this.loadExamByCode(this.accessCode);
      }
    });
  }

  generateCaptcha(): void {
    // Generate a random 5-character captcha
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.captchaText = result;
    this.captchaInput = '';
    this.captchaError = '';
  }

  validateCaptcha(): boolean {
    if (!this.captchaInput || !this.captchaInput.trim()) {
      this.captchaError = 'Please enter the captcha text';
      return false;
    }
    if (this.captchaInput.trim().toUpperCase() !== this.captchaText) {
      this.captchaError = 'Captcha text does not match. Please try again.';
      return false;
    }
    this.captchaError = '';
    return true;
  }

  isCaptchaValid(): boolean {
    if (!this.captchaInput || !this.captchaInput.trim()) {
      return false;
    }
    return this.captchaInput.trim().toUpperCase() === this.captchaText;
  }

  onCaptchaInput(): void {
    // Clear error when user starts typing
    if (this.captchaError) {
      this.captchaError = '';
    }
  }

  loadExamByCode(code: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.getExamByAccessCode(code).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;

        // Check if exam is published
        if (exam.status !== 'PUBLISHED') {
          this.errorMessage = 'This exam is not available for access.';
          this.exam = null;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Invalid access code. Please check the code and try again.';
        this.exam = null;
      }
    });
  }

  startExam(): void {
    // Check if user is a candidate
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'You must be logged in to take the exam';
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isCandidate()) {
      this.errorMessage = 'Only students (CANDIDATE role) can take exams. Your current role is: ' + currentUser.role;
      return;
    }

    // Validate captcha
    if (!this.validateCaptcha()) {
      return;
    }

    if (!this.exam?.id) {
      this.errorMessage = 'Exam not found';
      return;
    }

    if (!this.accessCode) {
      this.errorMessage = 'Access code is missing';
      return;
    }

    this.isAccessing = true;
    this.errorMessage = '';

    // Create exam session via backend using authenticated user
    // The backend will use the authenticated user's ID
    this.examService.startExamWithAccessCode(this.accessCode).subscribe({
      next: (response: any) => {
        if (!this.exam || !this.exam.id) {
          this.isAccessing = false;
          this.errorMessage = 'Exam not found';
          return;
        }

        // Store exam info in sessionStorage for exam-taking component
        sessionStorage.setItem('examAccess', JSON.stringify({
          examId: this.exam.id,
          accessCode: this.accessCode,
          examTitle: response.examTitle || this.exam.title,
          duration: response.duration || this.exam.duration
        }));

        // Navigate to exam instructions page first
        this.router.navigate(['/exam-instructions', this.exam.id], {
          queryParams: {
            accessCode: this.accessCode
          }
        });
      },
      error: (error) => {
        this.isAccessing = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to start exam. Please try again.';
      }
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getExamDate(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return '';
    }
  }

  getExamTime(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return '';
    }
  }

  getFullName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return '';

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return user.username;
    }
  }
}

