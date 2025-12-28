import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ExamService } from '../../services/exam.service';
import { Exam } from '../../services/exam.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  exams: Exam[] = [];
  isLoading: boolean = false;

  constructor(
    public authService: AuthService,
    private examService: ExamService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading = true;
    if (this.authService.isCandidate()) {
      this.examService.getAvailableExams().subscribe({
        next: (exams) => {
          this.exams = exams;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading exams:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.examService.getAllExams().subscribe({
        next: (exams) => {
          this.exams = exams;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading exams:', error);
          this.isLoading = false;
        }
      });
    }
  }
}
