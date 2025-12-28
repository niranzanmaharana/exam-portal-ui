import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamSessionService, AnswerWithQuestion } from '../../services/exam-session.service';
import { ResultService, ResultWithExam } from '../../services/result.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-result-answers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './result-answers.component.html',
  styleUrl: './result-answers.component.css'
})
export class ResultAnswersComponent implements OnInit {
  result: ResultWithExam | null = null;
  answers: AnswerWithQuestion[] = [];
  isLoading = false;
  error: string | null = null;
  resultId: number | null = null;
  sessionId: number | null = null;

  constructor(
    private examSessionService: ExamSessionService,
    private resultService: ResultService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.resultId = +params['id'];
      if (this.resultId) {
        this.loadResultAndAnswers();
      }
    });
  }

  loadResultAndAnswers(): void {
    if (!this.resultId) return;

    this.isLoading = true;
    this.error = null;

    // First load the result to get sessionId
    this.resultService.getResultById(this.resultId).subscribe({
      next: (result) => {
        this.result = result;
        this.sessionId = result.sessionId;
        if (this.sessionId) {
          this.loadAnswers();
        } else {
          this.error = 'Session ID not found';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load result details. Please try again.';
        this.isLoading = false;
        console.error('Error loading result:', err);
      }
    });
  }

  loadAnswers(): void {
    if (!this.sessionId) return;

    this.examSessionService.getAnswersWithQuestions(this.sessionId).subscribe({
      next: (answers) => {
        this.answers = answers;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load answers. Please try again.';
        this.isLoading = false;
        console.error('Error loading answers:', err);
      }
    });
  }

  parseOptions(options: string | undefined): string[] {
    if (!options) return [];
    try {
      return JSON.parse(options);
    } catch {
      return [];
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getQuestionTypeLabel(type: string | undefined): string {
    if (!type) return 'Unknown';
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'Multiple Choice';
      case 'TRUE_FALSE':
        return 'True/False';
      case 'SHORT_ANSWER':
        return 'Short Answer';
      case 'ESSAY':
        return 'Essay';
      default:
        return type;
    }
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  goBack(): void {
    if (this.resultId) {
      this.router.navigate(['/results', this.resultId]);
    } else {
      this.router.navigate(['/results']);
    }
  }
}

