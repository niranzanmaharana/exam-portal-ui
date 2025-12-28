import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, Exam } from '../../services/exam.service';
import { QuestionService, Question } from '../../services/question.service';
import { ExamSessionService, ExamSession, ExamSessionRequest } from '../../services/exam-session.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface CategoryGroup {
  categoryId: number | null;
  categoryName: string;
  questions: Question[];
  answeredCount: number;
}

interface Answer {
  questionId: number;
  answer: string;
}

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-taking.component.html',
  styleUrl: './exam-taking.component.css'
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  exam: Exam | null = null;
  examId: number | null = null;
  questions: Question[] = [];
  categories: CategoryGroup[] = [];
  selectedCategory: CategoryGroup | null = null;
  currentQuestions: Question[] = [];
  answers: Map<number, string> = new Map();
  
  // Timer
  timeRemaining: number = 0; // in seconds
  timerSubscription: Subscription | null = null;
  examStartTime: Date | null = null;
  examEndTime: Date | null = null; // Exam end time from exam settings
  sessionStartTime: Date | null = null; // When the student actually started the exam
  
  // UI State
  isLoading: boolean = true;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  
  // Session
  sessionId: number | null = null;
  studentName: string = '';
  registrationNumber: string = '';
  
  // Violation tracking
  examStartTimeForMonitoring: Date | null = null;
  isMonitoringActive: boolean = false;
  fullscreenWarningCount: number = 0; // Track fullscreen warnings (allow 1 warning)
  
  // Event listener references for cleanup
  private visibilityChangeHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private contextMenuHandler: ((e: Event) => void) | null = null;
  private copyHandler: ((e: Event) => void) | null = null;
  private pasteHandler: ((e: Event) => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private fullscreenChangeHandler: (() => void) | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private questionService: QuestionService,
    private examSessionService: ExamSessionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get exam ID and student info from route
    this.route.params.subscribe(params => {
      this.examId = +params['examId'];
      if (this.examId) {
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
        
        // Get access code from query params or sessionStorage
        let accessCode = '';
        this.route.queryParams.subscribe(queryParams => {
          accessCode = queryParams['accessCode'] || '';
        });
        
        // Try to get from sessionStorage
        const examAccess = sessionStorage.getItem('examAccess');
        if (examAccess) {
          try {
            const accessData = JSON.parse(examAccess);
            if (!accessCode) accessCode = accessData.accessCode || '';
          } catch (e) {
            console.error('Error parsing exam access data:', e);
          }
        }
        
        this.loadExamData();
      }
    });
  }

  ngOnDestroy(): void {
    // Stop monitoring
    this.isMonitoringActive = false;
    
    // Remove all event listeners
    this.removeEventListeners();
    
    // Exit fullscreen if we're in it
    this.exitFullscreen();
    
    // Unsubscribe from timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  
  private removeEventListeners(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      this.focusHandler = null;
    }
    
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
      this.blurHandler = null;
    }
    
    if (this.contextMenuHandler) {
      document.removeEventListener('contextmenu', this.contextMenuHandler);
      this.contextMenuHandler = null;
    }
    
    if (this.copyHandler) {
      document.removeEventListener('copy', this.copyHandler);
      this.copyHandler = null;
    }
    
    if (this.pasteHandler) {
      document.removeEventListener('paste', this.pasteHandler);
      this.pasteHandler = null;
    }
    
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    
    if (this.fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenChangeHandler);
      this.fullscreenChangeHandler = null;
    }
  }

  loadExamData(): void {
    if (!this.examId) return;

    this.isLoading = true;
    
    // Load exam details
    this.examService.getExamByAccessCode(this.route.snapshot.queryParams['accessCode'] || '').subscribe({
      next: (exam) => {
        this.exam = exam;
        
        // Validate exam time
        if (!this.validateExamTime(exam)) {
          return;
        }
        
        // Calculate time remaining based on end time or duration
        this.calculateTimeRemaining(exam);
        this.sessionStartTime = new Date();
        this.startTimer();
        this.setupViolationMonitoring(); // Setup monitoring after exam is loaded
        this.setupFullscreen(); // Setup fullscreen if required
        this.loadQuestions();
      },
      error: (error) => {
        // Try loading by ID if access code fails
        this.examService.getExamById(this.examId!).subscribe({
          next: (exam) => {
            this.exam = exam;
            
            // Validate exam time
            if (!this.validateExamTime(exam)) {
              return;
            }
            
            // Calculate time remaining based on end time or duration
            this.calculateTimeRemaining(exam);
            this.sessionStartTime = new Date();
            this.startTimer();
            this.setupViolationMonitoring(); // Setup monitoring after exam is loaded
            this.setupFullscreen(); // Setup fullscreen if required
            this.loadQuestions();
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = 'Failed to load exam details';
          }
        });
      }
    });
  }
  
  validateExamTime(exam: Exam): boolean {
    const now = new Date();
    
    // If exam has a start time, check if it has started
    if (exam.startTime) {
      const startTime = new Date(exam.startTime);
      if (now < startTime) {
        this.isLoading = false;
        this.errorMessage = 'The exam has not started yet. Please wait for the scheduled start time.';
        // Redirect back to instructions page after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/exam-instructions', this.examId], {
            queryParams: {
              accessCode: this.route.snapshot.queryParams['accessCode'] || ''
            }
          });
        }, 3000);
        return false;
      }
    }
    
    // If exam has an end time, check if it has ended
    if (exam.endTime) {
      const endTime = new Date(exam.endTime);
      this.examEndTime = endTime; // Store for timer calculations
      if (now > endTime) {
        this.isLoading = false;
        this.errorMessage = 'The exam has ended. You cannot access the exam now.';
        // Redirect back to instructions page after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/exam-instructions', this.examId], {
            queryParams: {
              accessCode: this.route.snapshot.queryParams['accessCode'] || ''
            }
          });
        }, 3000);
        return false;
      }
    }
    
    return true;
  }

  calculateTimeRemaining(exam: Exam): void {
    const now = new Date();
    
    // Priority 1: If end time is set, use time until end time (hard deadline)
    // This handles late starts automatically - if student starts late, they get less time
    if (exam.endTime) {
      const endTime = new Date(exam.endTime);
      const diffMs = endTime.getTime() - now.getTime();
      if (diffMs > 0) {
        this.timeRemaining = Math.floor(diffMs / 1000); // Convert to seconds
      } else {
        this.timeRemaining = 0; // End time has passed
      }
      return;
    }
    
    // Priority 2: If only duration is set, use duration
    if (exam.duration) {
      this.timeRemaining = exam.duration * 60; // Convert minutes to seconds
      return;
    }
    
    // Default: 60 minutes if neither is set
    this.timeRemaining = 60 * 60;
  }

  loadQuestions(): void {
    if (!this.examId) return;

    this.questionService.getRandomQuestionsForExam(this.examId).subscribe({
      next: (questions) => {
        // Select only 10 questions randomly
        if (questions.length > 10) {
          // Shuffle array and take first 10
          const shuffled = [...questions].sort(() => Math.random() - 0.5);
          this.questions = shuffled.slice(0, 10);
        } else {
          this.questions = questions;
        }
        this.groupQuestionsByCategory();
        
        // Create exam session after questions are loaded
        this.createExamSession();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load questions';
      }
    });
  }

  createExamSession(): void {
    if (!this.examId) return;

    // Get authenticated user ID
    const currentUser = this.authService.getCurrentUser();
    
    // Only send studentId for authenticated users (don't send studentName/registrationNumber)
    // The backend will populate these from the user record
    const sessionRequest: ExamSessionRequest = {
      examId: this.examId,
      studentId: currentUser?.id
    };

    this.examSessionService.createSession(sessionRequest).subscribe({
      next: (session) => {
        this.sessionId = session.id!;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to create exam session:', error);
        this.isLoading = false;
        this.errorMessage = 'Failed to start exam session';
      }
    });
  }

  groupQuestionsByCategory(): void {
    const categoryMap = new Map<number | null, Question[]>();
    
    // Group questions by category
    this.questions.forEach(question => {
      const categoryId = question.category?.id || null;
      const categoryName = question.category?.name || 'Uncategorized';
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, []);
      }
      categoryMap.get(categoryId)!.push(question);
    });

    // Convert to CategoryGroup array
    this.categories = Array.from(categoryMap.entries()).map(([categoryId, questions]) => {
      const categoryName = questions[0].category?.name || 'Uncategorized';
      return {
        categoryId,
        categoryName,
        questions,
        answeredCount: 0
      };
    });

    // Update answered counts
    this.updateAnsweredCounts();

    // Select first category by default
    if (this.categories.length > 0) {
      this.selectCategory(this.categories[0]);
    }
  }

  selectCategory(category: CategoryGroup): void {
    this.selectedCategory = category;
    this.currentQuestions = category.questions;
    this.updateAnsweredCounts();
  }

  updateAnsweredCounts(): void {
    this.categories.forEach(category => {
      category.answeredCount = category.questions.filter(q => 
        this.answers.has(q.id!) && this.answers.get(q.id!)!.trim() !== ''
      ).length;
    });
  }

  onAnswerChange(questionId: number, answer: string): void {
    this.answers.set(questionId, answer);
    this.updateAnsweredCounts();
  }

  getAnswer(questionId: number): string {
    return this.answers.get(questionId) || '';
  }

  getTotalAnswered(): number {
    return this.answers.size;
  }

  getTotalQuestions(): number {
    return this.questions.length;
  }

  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      const now = new Date();
      
      // Check if end time has been reached
      if (this.examEndTime && now >= this.examEndTime) {
        this.timeRemaining = 0;
        this.submitExam(true); // Auto-submit when end time is reached
        return;
      }
      
      // Update time remaining based on end time if available
      if (this.examEndTime) {
        const diffMs = this.examEndTime.getTime() - now.getTime();
        if (diffMs > 0) {
          this.timeRemaining = Math.floor(diffMs / 1000);
        } else {
          this.timeRemaining = 0;
          this.submitExam(true); // Auto-submit when end time is reached
          return;
        }
      } else {
        // If no end time, use countdown timer
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          this.submitExam(true); // Auto-submit when time expires
        }
      }
    });
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  submitExam(isAutoSubmit: boolean = false): void {
    if (this.isSubmitting || !this.sessionId) return;

    if (!isAutoSubmit) {
      const confirmed = confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.');
      if (!confirmed) return;
    }

    this.isSubmitting = true;
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Convert Map to object for submission
    const answersObject: { [key: number]: string } = {};
    this.answers.forEach((value, key) => {
      answersObject[key] = value;
    });

    const submissionRequest = {
      sessionId: this.sessionId,
      answers: answersObject
    };

    this.examSessionService.submitExam(submissionRequest).subscribe({
      next: (result) => {
        // Navigate to acknowledgment page with result data
        this.router.navigate(['/exam-acknowledgment'], {
          queryParams: { sessionId: this.sessionId },
          state: { result: result }
        });
      },
      error: (error) => {
        console.error('Failed to submit exam:', error);
        alert('Failed to submit exam. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  reportException(reason: string): void {
    if (!this.sessionId) return;

    const exceptionRequest = {
      sessionId: this.sessionId,
      reason: reason
    };

    this.examSessionService.reportException(exceptionRequest).subscribe({
      next: () => {
        alert(`Exam terminated due to: ${reason}`);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Failed to report exception:', error);
      }
    });
  }

  setupViolationMonitoring(): void {
    if (!this.exam) return;

    // Set exam start time for monitoring (wait a bit before starting to monitor)
    this.examStartTimeForMonitoring = new Date();
    
    // Wait 2 seconds before starting monitoring to avoid false positives on page load
    setTimeout(() => {
      this.startViolationMonitoring();
    }, 2000);
  }

  setupFullscreen(): void {
    if (!this.exam || !this.exam.requireFullscreen) return;

    // Request fullscreen when exam starts
    this.requestFullscreen().then(() => {
      // Monitor fullscreen changes
      this.monitorFullscreen();
    }).catch((error) => {
      // If fullscreen request fails, prevent exam from starting
      console.warn('Fullscreen request failed:', error);
      alert('Fullscreen mode is required for this exam. Please allow fullscreen access to continue.');
      this.errorMessage = 'Fullscreen mode is required. Please enable fullscreen to start the exam.';
      this.isLoading = false;
      // Redirect back to instructions
      setTimeout(() => {
        this.router.navigate(['/exam-instructions', this.examId], {
          queryParams: {
            name: this.studentName,
            regd: this.registrationNumber,
            accessCode: this.route.snapshot.queryParams['accessCode'] || ''
          }
        });
      }, 3000);
    });
  }

  private requestFullscreen(): Promise<void> {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      return (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      return (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      return (element as any).msRequestFullscreen();
    }
    
    return Promise.reject('Fullscreen API not supported');
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  private isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  private monitorFullscreen(): void {
    if (!this.exam || !this.exam.requireFullscreen) return;

    this.fullscreenChangeHandler = () => {
      if (!this.isMonitoringActive || !this.isOnExamPage() || !this.exam) return;

      if (!this.isFullscreen()) {
        // Fullscreen was exited
        this.handleFullscreenExit();
      }
    };

    // Add listeners for all browser prefixes
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('mozfullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('MSFullscreenChange', this.fullscreenChangeHandler);
  }

  private handleFullscreenExit(): void {
    if (!this.exam || !this.exam.requireFullscreen) return;

    this.fullscreenWarningCount++;

    if (this.fullscreenWarningCount === 1) {
      // First violation: warn and try to re-enter fullscreen
      alert('Warning: Fullscreen mode is required for this exam. Please enter fullscreen mode. If you exit fullscreen again, your exam will be automatically submitted.');
      
      // Try to re-enter fullscreen
      this.requestFullscreen().catch(() => {
        // If re-entry fails, report exception and submit immediately
        if (this.sessionId) {
          const exceptionRequest = {
            sessionId: this.sessionId,
            reason: 'Fullscreen mode exited and failed to re-enter'
          };
          this.examSessionService.reportException(exceptionRequest).subscribe({
            next: () => {
              alert('Failed to re-enter fullscreen. Your exam will be automatically submitted.');
              this.submitExam(true);
            },
            error: (error) => {
              console.error('Failed to report exception:', error);
              alert('Failed to re-enter fullscreen. Your exam will be automatically submitted.');
              this.submitExam(true);
            }
          });
        } else {
          alert('Failed to re-enter fullscreen. Your exam will be automatically submitted.');
          this.submitExam(true);
        }
      });
    } else {
      // Second violation: report exception and submit exam
      if (this.sessionId) {
        const exceptionRequest = {
          sessionId: this.sessionId,
          reason: 'Fullscreen mode exited (second violation)'
        };
        this.examSessionService.reportException(exceptionRequest).subscribe({
          next: () => {
            alert('Fullscreen mode exited again. Your exam will be automatically submitted.');
            this.submitExam(true);
          },
          error: (error) => {
            console.error('Failed to report exception:', error);
            alert('Fullscreen mode exited again. Your exam will be automatically submitted.');
            this.submitExam(true);
          }
        });
      } else {
        alert('Fullscreen mode exited again. Your exam will be automatically submitted.');
        this.submitExam(true);
      }
    }
  }

  startViolationMonitoring(): void {
    if (!this.exam) return;

    // Remove any existing listeners first
    this.removeEventListeners();
    
    // Set monitoring as active
    this.isMonitoringActive = true;

    const exam = this.exam; // Store reference to avoid null checks in event listeners
    let isPageVisible = !document.hidden;
    let lastFocusTime = Date.now();
    let blurTimeout: any = null;
    let wasPageVisible = !document.hidden;

    // Monitor tab switch and window focus loss together
    // Use visibilitychange as the primary indicator (more reliable)
    this.visibilityChangeHandler = () => {
      // Check if we're still on the exam-taking page
      if (!this.isMonitoringActive || !exam || !this.isOnExamPage()) return;
      
      const nowVisible = !document.hidden;
      
      // Tab switch and window focus loss detection (consolidated)
      if (exam.preventTabSwitch) {
        if (document.hidden && wasPageVisible) {
          wasPageVisible = false;
          const timeSinceStart = Date.now() - (this.examStartTimeForMonitoring?.getTime() || 0);
          // Only trigger if exam has been running for at least 3 seconds to avoid false positives
          if (timeSinceStart > 3000) {
            this.handleViolation('Tab switch or window focus lost detected');
          }
        } else if (!document.hidden && !wasPageVisible) {
          wasPageVisible = true;
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Additional blur event monitoring (as secondary check, but less reliable)
    if (exam.preventTabSwitch) {
      this.focusHandler = () => {
        if (!this.isMonitoringActive || !this.isOnExamPage()) return;
        
        // Clear any pending blur timeout when window regains focus
        if (blurTimeout) {
          clearTimeout(blurTimeout);
          blurTimeout = null;
        }
        lastFocusTime = Date.now();
        wasPageVisible = true;
      };
      window.addEventListener('focus', this.focusHandler);

      this.blurHandler = () => {
        if (!this.isMonitoringActive || !this.isOnExamPage()) return;
        
        // Only use blur event if visibilitychange didn't catch it
        // This is a fallback mechanism
        const timeSinceStart = Date.now() - (this.examStartTimeForMonitoring?.getTime() || 0);
        const timeSinceFocus = Date.now() - lastFocusTime;
        
        // Only trigger if:
        // 1. At least 3 seconds have passed since exam start
        // 2. Window was focused for at least 2 seconds
        // 3. Page is actually hidden (verified)
        if (timeSinceStart > 3000 && timeSinceFocus > 2000) {
          // Use a delay to verify it's a real blur
          blurTimeout = setTimeout(() => {
            // Only trigger if page is actually hidden and still on exam page
            if (document.hidden && this.isMonitoringActive && this.isOnExamPage()) {
              this.handleViolation('Tab switch or window focus lost detected');
            }
          }, 1500); // Longer delay to avoid false positives
        }
      };
      window.addEventListener('blur', this.blurHandler);
    }

    // Monitor right click - Only prevent, don't submit
    if (exam.disableRightClick) {
      this.contextMenuHandler = (e: Event) => {
        if (!this.isMonitoringActive || !this.isOnExamPage()) return;
        e.preventDefault();
        // Only prevent the action, don't submit exam
      };
      document.addEventListener('contextmenu', this.contextMenuHandler);
    }

    // Monitor copy/paste - Only prevent, don't submit
    if (exam.disableCopyPaste) {
      this.copyHandler = (e: Event) => {
        if (!this.isMonitoringActive || !this.isOnExamPage()) return;
        e.preventDefault();
        // Only prevent the action, don't submit exam
      };
      document.addEventListener('copy', this.copyHandler);
      
      this.pasteHandler = (e: Event) => {
        if (!this.isMonitoringActive || !this.isOnExamPage()) return;
        e.preventDefault();
        // Only prevent the action, don't submit exam
      };
      document.addEventListener('paste', this.pasteHandler);
    }

    // Monitor print screen - Only prevent, don't submit
    if (exam.disablePrintScreen) {
      this.keydownHandler = (e: KeyboardEvent) => {
        if (!this.isMonitoringActive || !this.isOnExamPage()) return;
        if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
          e.preventDefault();
          // Only prevent the action, don't submit exam
        }
      };
      document.addEventListener('keydown', this.keydownHandler);
    }
  }
  
  private isOnExamPage(): boolean {
    // Check if we're still on the exam-taking page
    const currentUrl = this.router.url || window.location.pathname;
    return currentUrl.includes('/exam-taking/');
  }

  handleViolation(reason: string): void {
    // This method is only for violations that should report exception and submit exam
    // Tab switch, window focus loss, fullscreen exit, browser close
    
    // Double-check we're still on the exam page before handling violations
    if (!this.isOnExamPage() || !this.isMonitoringActive || !this.exam) {
      return;
    }
    
    // Verify the specific restriction is enabled before handling violation
    if (reason.includes('Tab switch') && !this.exam.preventTabSwitch) {
      return;
    }
    if (reason.includes('Fullscreen') && !this.exam.requireFullscreen) {
      return;
    }
    
    // Report exception to backend before submitting
    if (this.sessionId) {
      const exceptionRequest = {
        sessionId: this.sessionId,
        reason: reason
      };
      
      // Report exception first, then submit
      this.examSessionService.reportException(exceptionRequest).subscribe({
        next: () => {
          // Exception reported successfully, now submit the exam
          alert(`Exam terminated: ${reason}. Your exam has been automatically submitted.`);
          this.submitExam(true);
        },
        error: (error) => {
          // Even if exception report fails, still try to submit
          console.error('Failed to report exception:', error);
          alert(`Exam terminated: ${reason}. Your exam has been automatically submitted.`);
          this.submitExam(true);
        }
      });
    } else {
      // No session ID, just submit
      alert(`Exam terminated: ${reason}. Your exam has been automatically submitted.`);
      this.submitExam(true);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.sessionId && !this.isSubmitting) {
      // Report abrupt closure with exception reason and status update
      const exceptionRequest = {
        sessionId: this.sessionId,
        reason: 'Browser closed or page refreshed'
      };
      
      // Use sendBeacon for reliable reporting even if page is closing
      const data = JSON.stringify(exceptionRequest);
      navigator.sendBeacon(`${environment.apiUrl}/exam-sessions/exception`, 
        new Blob([data], { type: 'application/json' }));
    }
  }

  isTimeRunningOut(): boolean {
    return this.timeRemaining < 300; // Less than 5 minutes
  }

  getCategoryStatusClass(category: CategoryGroup): string {
    if (category.answeredCount === category.questions.length) {
      return 'text-success';
    } else if (category.answeredCount > 0) {
      return 'text-warning';
    }
    return 'text-muted';
  }

  parseOptions(optionsString: string): string[] {
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(optionsString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // If not JSON, try splitting by comma
      return optionsString.split(',').map(opt => opt.trim());
    }
    return [];
  }
}
