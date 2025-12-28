import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, Exam } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-exam-instructions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-instructions.component.html',
  styleUrl: './exam-instructions.component.css'
})
export class ExamInstructionsComponent implements OnInit, OnDestroy {
  exam: Exam | null = null;
  examId: number | null = null;
  studentName: string = '';
  registrationNumber: string = '';
  accessCode: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Terms and conditions
  agreedToTerms: boolean = false;
  
  // Time checking
  canStartExam: boolean = false;
  timeUntilStart: string = '';
  countdownSubscription: Subscription | null = null;
  examStartTime: Date | null = null;
  examEndTime: Date | null = null;

  constructor(
    private examService: ExamService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get exam ID from route
    this.route.params.subscribe(params => {
      this.examId = +params['examId'];
    });

    // Get access code from query params or sessionStorage
    this.route.queryParams.subscribe(params => {
      this.accessCode = params['accessCode'] || '';
    });

    // Get logged-in user info
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Use full name from user
      const firstName = currentUser.firstName || '';
      const lastName = currentUser.lastName || '';
      if (firstName && lastName) {
        this.studentName = `${firstName} ${lastName}`;
      } else if (firstName) {
        this.studentName = firstName;
      } else if (lastName) {
        this.studentName = lastName;
      } else {
        this.studentName = currentUser.username;
      }
      
      // Use registration code if available, otherwise use email or username
      this.registrationNumber = currentUser.registrationCode || currentUser.email || currentUser.username;
    }

    // Try to get from sessionStorage if not in query params
    const examAccess = sessionStorage.getItem('examAccess');
    if (examAccess) {
      try {
        const accessData = JSON.parse(examAccess);
        if (!this.accessCode) this.accessCode = accessData.accessCode || '';
        if (!this.examId) this.examId = accessData.examId || null;
      } catch (e) {
        console.error('Error parsing exam access data:', e);
      }
    }

    // Load exam details
    if (this.examId) {
      this.loadExam();
    } else {
      this.errorMessage = 'Exam ID not found';
    }
  }
  
  checkExamTime(): void {
    if (!this.exam) return;
    
    const now = new Date();
    
    // Parse exam start and end times
    if (this.exam.startTime) {
      this.examStartTime = new Date(this.exam.startTime);
    }
    if (this.exam.endTime) {
      this.examEndTime = new Date(this.exam.endTime);
    }
    
    // If no start time is set, allow starting immediately
    if (!this.examStartTime) {
      this.canStartExam = true;
      this.timeUntilStart = '';
      return;
    }
    
    // Check if exam has ended
    if (this.examEndTime && now > this.examEndTime) {
      this.canStartExam = false;
      this.timeUntilStart = 'The exam has ended.';
      return;
    }
    
    // Check if exam can start
    if (now >= this.examStartTime) {
      this.canStartExam = true;
      this.timeUntilStart = 'The exam is now available. You can start the exam.';
      return;
    }
    
    // Exam hasn't started yet
    this.canStartExam = false;
    this.updateTimeUntilStart();
    
    // Start countdown timer
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.updateTimeUntilStart();
    });
  }
  
  updateTimeUntilStart(): void {
    if (!this.examStartTime) {
      this.canStartExam = true;
      this.timeUntilStart = '';
      return;
    }
    
    const now = new Date();
    const diff = this.examStartTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      this.canStartExam = true;
      this.timeUntilStart = 'The exam is now available. You can start the exam.';
      if (this.countdownSubscription) {
        this.countdownSubscription.unsubscribe();
        this.countdownSubscription = null;
      }
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
      this.timeUntilStart = `Exam starts in ${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      this.timeUntilStart = `Exam starts in ${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}, ${seconds} second${seconds > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      this.timeUntilStart = `Exam starts in ${minutes} minute${minutes > 1 ? 's' : ''}, ${seconds} second${seconds > 1 ? 's' : ''}`;
    } else {
      this.timeUntilStart = `Exam starts in ${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  loadExam(): void {
    if (!this.examId) return;

    // Try to get exam from sessionStorage first
    const examAccess = sessionStorage.getItem('examAccess');
    if (examAccess) {
      try {
        const accessData = JSON.parse(examAccess);
        // If we have access code, use it to get exam details (public endpoint)
        if (this.accessCode || accessData.accessCode) {
          const code = this.accessCode || accessData.accessCode;
          this.loadExamByAccessCode(code);
          return;
        }
      } catch (e) {
        console.error('Error parsing exam access data:', e);
      }
    }

    // Fallback: try to load by ID (might require auth)
    this.isLoading = true;
    this.examService.getExamById(this.examId).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        this.checkExamTime();
      },
      error: (error) => {
        // If auth fails, try using access code
        if (this.accessCode) {
          this.loadExamByAccessCode(this.accessCode);
        } else {
          this.isLoading = false;
          this.errorMessage = 'Failed to load exam details';
        }
      }
    });
  }

  loadExamByAccessCode(code: string): void {
    this.isLoading = true;
    this.examService.getExamByAccessCode(code).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        this.checkExamTime();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load exam details';
      }
    });
  }

  startExam(): void {
    if (!this.examId) {
      this.errorMessage = 'Exam ID not found';
      return;
    }

    // Validate terms and conditions
    if (!this.agreedToTerms) {
      this.errorMessage = 'Please agree to the terms and conditions to proceed.';
      return;
    }

    // Check if exam can be started (time validation)
    if (!this.canStartExam) {
      this.errorMessage = 'The exam has not started yet. Please wait for the scheduled start time.';
      return;
    }
    
    // Check if exam has ended
    if (this.examEndTime && new Date() > this.examEndTime) {
      this.errorMessage = 'The exam has ended. You cannot start the exam now.';
      return;
    }

    // Navigate to exam-taking page
    this.router.navigate(['/exam-taking', this.examId], {
      queryParams: {
        accessCode: this.accessCode
      }
    });
  }

  goBack(): void {
    if (this.accessCode) {
      this.router.navigate(['/exam-access', this.accessCode]);
    } else {
      this.router.navigate(['/home']);
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  hasSecurityRestrictions(): boolean {
    if (!this.exam) return false;
    return !!(this.exam.requireFullscreen || 
              this.exam.disableRightClick || 
              this.exam.requireCamera || 
              this.exam.disableCopyPaste || 
              this.exam.disablePrintScreen || 
              this.exam.preventTabSwitch);
  }
}

