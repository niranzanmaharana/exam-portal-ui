import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import QRCode from 'qrcode';
import { ExamService, Exam } from '../../services/exam.service';
import { QuestionService, Question } from '../../services/question.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './exam-detail.component.html',
  styleUrl: './exam-detail.component.css'
})
export class ExamDetailComponent implements OnInit {
  exam: Exam | null = null;
  questions: Question[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  examId: number | null = null;
  qrCodeDataUrl: string = '';
  showQRModal: boolean = false;
  showCopyTooltip: boolean = false;

  constructor(
    private examService: ExamService,
    private questionService: QuestionService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.examId = +params['id'];
      if (this.examId) {
        this.loadExam(this.examId);
        this.loadQuestions(this.examId);
      }
    });
  }

  loadExam(id: number): void {
    this.isLoading = true;
    this.examService.getExamById(id).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        // Generate QR code if exam is published and has access code
        if (exam.status === 'PUBLISHED' && exam.accessCode) {
          this.generateQRCode();
        } else {
          this.qrCodeDataUrl = '';
        }
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.errorMessage = 'Failed to load exam';
        this.isLoading = false;
      }
    });
  }

  generateQRCode(): void {
    const link = this.getAccessLink();
    if (link) {
      QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then((url: string) => {
        this.qrCodeDataUrl = url;
        this.cdr.detectChanges();
      }).catch((err: any) => {
        console.error('Error generating QR code:', err);
      });
    }
  }

  loadQuestions(examId: number): void {
    this.questionService.getQuestionsByExamId(examId).subscribe({
      next: (questions) => {
        this.questions = questions;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
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

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'DRAFT': 'Draft',
      'PUBLISHED': 'Published',
      'ACTIVE': 'Active',
      'COMPLETED': 'Completed'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'DRAFT': 'status-draft',
      'PUBLISHED': 'status-published',
      'ACTIVE': 'status-active',
      'COMPLETED': 'status-completed'
    };
    return classes[status] || '';
  }

  getQuestionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'TRUE_FALSE': 'True/False',
      'SHORT_ANSWER': 'Short Answer',
      'ESSAY': 'Essay'
    };
    return labels[type] || type;
  }

  editExam(): void {
    if (this.exam?.id) {
      this.router.navigate(['/exams', this.exam.id, 'edit']);
    }
  }

  publishExam(): void {
    if (!this.exam?.id) return;

    if (!confirm('Are you sure you want to publish this exam? Published exams will be visible to candidates.')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.examService.publishExam(this.exam.id).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        // Reload to show access code and link
        this.loadExam(this.exam.id!);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to publish exam';
      }
    });
  }

  getAccessLink(): string {
    if (!this.exam?.accessCode) return '';
    return `${window.location.origin}/exam-access/${this.exam.accessCode}`;
  }

  copyAccessLink(): void {
    const link = this.getAccessLink();
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        this.showCopyTooltip = true;
        setTimeout(() => {
          this.showCopyTooltip = false;
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showCopyTooltip = true;
        setTimeout(() => {
          this.showCopyTooltip = false;
        }, 2000);
      });
    }
  }

  regenerateAccessCode(): void {
    if (!this.exam?.id) return;

    if (!confirm('Are you sure you want to regenerate the access code? The old link will no longer work.')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.examService.regenerateAccessCode(this.exam.id).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        // Generate new QR code
        if (exam.accessCode) {
          this.generateQRCode();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to regenerate access code';
      }
    });
  }

  canPublish(): boolean {
    if (!this.exam) return false;
    return this.exam.status === 'DRAFT' && this.canEdit();
  }

  addQuestion(): void {
    if (this.examId) {
      this.router.navigate(['/questions/new'], { queryParams: { examId: this.examId } });
    }
  }

  editQuestion(question: Question): void {
    if (question.id) {
      this.router.navigate(['/questions', question.id, 'edit']);
    }
  }

  deleteQuestion(id: number): void {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    this.questionService.deleteQuestion(id).subscribe({
      next: () => {
        if (this.examId) {
          this.loadQuestions(this.examId);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to delete question';
      }
    });
  }

  get totalQuestionMarks(): number {
    return this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }

  canEdit(): boolean {
    if (!this.exam) return false;
    // Only organizers can edit their own exams
    if (!this.authService.isOrganizer()) return false;
    const currentUser = this.authService.getCurrentUser();
    return this.exam.createdBy === currentUser?.id;
  }

  openQRCodeModal(): void {
    if (this.qrCodeDataUrl) {
      this.showQRModal = true;
    }
  }

  closeQRCodeModal(): void {
    this.showQRModal = false;
  }


  removeQuestionFromExam(questionId: number | undefined): void {
    if (!this.examId || !questionId) return;

    if (!confirm('Are you sure you want to remove this question from the exam?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.examService.removeQuestionsFromExam(this.examId, [questionId]).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        // Reload questions
        this.loadQuestions(this.examId!);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to remove question';
      }
    });
  }
}
