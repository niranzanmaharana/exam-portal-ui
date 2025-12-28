import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResultService, ResultWithExam } from '../../services/result.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './result-list.component.html',
  styleUrl: './result-list.component.css'
})
export class ResultListComponent implements OnInit {
  results: ResultWithExam[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private resultService: ResultService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadResults();
  }

  loadResults(): void {
    this.isLoading = true;
    this.error = null;

    this.resultService.getResults().subscribe({
      next: (results) => {
        this.results = results;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load results. Please try again.';
        this.isLoading = false;
        console.error('Error loading results:', err);
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

  formatDateShort(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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

  isPassed(result: ResultWithExam): boolean {
    if (!result.passingMarks) return false;
    return result.obtainedMarks >= result.passingMarks;
  }
}
