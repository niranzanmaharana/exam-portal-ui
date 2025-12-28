import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamSessionService, ExamResult } from '../../services/exam-session.service';
import { ExamService, Exam } from '../../services/exam.service';

@Component({
  selector: 'app-exam-acknowledgment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-acknowledgment.component.html',
  styleUrl: './exam-acknowledgment.component.css'
})
export class ExamAcknowledgmentComponent implements OnInit {
  result: ExamResult | null = null;
  exam: Exam | null = null;
  sessionId: number | null = null;
  timeTaken: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examSessionService: ExamSessionService,
    private examService: ExamService
  ) {}

  ngOnInit(): void {
    // Get session ID from query params
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['sessionId'] ? +params['sessionId'] : null;
      this.loadResult();
    });
  }

  loadResult(): void {
    // First try to get result from navigation state (if just submitted)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['result']) {
      this.result = navigation.extras.state['result'];
      if (this.sessionId) {
        this.loadSessionAndExam();
      } else {
        this.loadExamDetails();
        this.isLoading = false;
      }
      return;
    }

    // If no state, try to load from session ID
    if (!this.sessionId) {
      this.errorMessage = 'No result data found';
      this.isLoading = false;
      return;
    }

    // Load result from backend
    this.examSessionService.getResult(this.sessionId).subscribe({
      next: (result) => {
        this.result = result;
        this.loadSessionAndExam();
      },
      error: (error) => {
        console.error('Failed to load result:', error);
        this.errorMessage = 'Result data not available';
        this.isLoading = false;
      }
    });
  }

  loadSessionAndExam(): void {
    if (!this.sessionId) {
      this.isLoading = false;
      return;
    }

    // Get session to calculate time taken
    this.examSessionService.getSession(this.sessionId).subscribe({
      next: (session) => {
        if (session.startTime && session.endTime) {
          const start = new Date(session.startTime);
          const end = new Date(session.endTime);
          const diffMs = end.getTime() - start.getTime();
          this.timeTaken = this.formatTimeTaken(diffMs);
        }
        
        // Load exam details
        if (session.examId) {
          this.loadExamDetails(session.examId);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load session:', error);
        // Still show result even if session load fails
        if (this.result) {
          this.loadExamDetails(this.result.examId);
        }
        this.isLoading = false;
      }
    });
  }

  loadExamDetails(examId?: number): void {
    const id = examId || this.result?.examId;
    if (!id) return;

    this.examService.getExamById(id).subscribe({
      next: (exam) => {
        this.exam = exam;
      },
      error: (error) => {
        console.error('Failed to load exam:', error);
      }
    });
  }

  formatTimeTaken(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}

