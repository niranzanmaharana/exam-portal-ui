import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService, Exam } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.css'
})
export class ExamListComponent implements OnInit {
  exams: Exam[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  selectedStatus: string | null = null;

  constructor(
    private examService: ExamService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.getAllExams().subscribe({
      next: (exams) => {
        this.exams = exams;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exams:', error);
        this.errorMessage = error.error?.message || 'Failed to load exams';
        this.isLoading = false;
      }
    });
  }

  get filteredExams(): Exam[] {
    let filtered = [...this.exams];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(e => e.status === this.selectedStatus);
    }

    return filtered;
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

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
  }

  createExam(): void {
    this.router.navigate(['/exams/new']);
  }

  viewExam(exam: Exam): void {
    if (exam.id) {
      this.router.navigate(['/exams', exam.id]);
    }
  }

  editExam(exam: Exam): void {
    if (exam.id) {
      this.router.navigate(['/exams', exam.id, 'edit']);
    }
  }

  deleteExam(id: number): void {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.examService.deleteExam(id).subscribe({
      next: () => {
        this.isLoading = false;
        this.loadExams();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to delete exam';
      }
    });
  }

  canEdit(exam: Exam): boolean {
    // Only organizers can edit their own exams
    if (this.authService.isAdmin()) return false;
    const currentUser = this.authService.getCurrentUser();
    return exam.createdBy === currentUser?.id;
  }

  canDelete(exam: Exam): boolean {
    // Only organizers can delete their own exams
    return this.canEdit(exam);
  }
}
