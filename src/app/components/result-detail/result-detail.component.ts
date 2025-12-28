import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ResultService, ResultWithExam } from '../../services/result.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-result-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './result-detail.component.html',
  styleUrl: './result-detail.component.css'
})
export class ResultDetailComponent implements OnInit {
  result: ResultWithExam | null = null;
  isLoading = false;
  error: string | null = null;
  resultId: number | null = null;

  constructor(
    private resultService: ResultService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.resultId = +params['id'];
      if (this.resultId) {
        this.loadResult();
      }
    });
  }

  loadResult(): void {
    if (!this.resultId) return;

    this.isLoading = true;
    this.error = null;

    this.resultService.getResultById(this.resultId).subscribe({
      next: (result) => {
        this.result = result;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load result details. Please try again.';
        this.isLoading = false;
        console.error('Error loading result:', err);
      }
    });
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

  formatPercentage(percentage: number): string {
    return percentage.toFixed(2);
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'text-secondary';
    switch (status.toUpperCase()) {
      case 'SUBMITTED':
        return 'text-success';
      case 'TERMINATED':
        return 'text-danger';
      case 'TIMED_OUT':
        return 'text-warning';
      case 'IN_PROGRESS':
        return 'text-info';
      default:
        return 'text-secondary';
    }
  }

  getGradeBadgeClass(grade: string | undefined): string {
    if (!grade) return 'text-secondary';
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
        return 'text-success';
      case 'B+':
      case 'B':
        return 'text-info';
      case 'C':
        return 'text-warning';
      case 'F':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  }

  isPassed(): boolean {
    if (!this.result || !this.result.passingMarks) return false;
    return this.result.obtainedMarks >= this.result.passingMarks;
  }

  goBack(): void {
    this.router.navigate(['/results']);
  }
}
