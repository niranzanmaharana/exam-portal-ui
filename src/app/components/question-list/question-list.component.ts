import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { QuestionService, Question } from '../../services/question.service';
import { CategoryService, Category } from '../../services/category.service';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './question-list.component.html',
  styleUrl: './question-list.component.css'
})
export class QuestionListComponent implements OnInit {
  questions: Question[] = [];
  categories: Category[] = [];
  exams: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  selectedCategoryId: number | null = null;
  selectedExamId: number | null = null;
  selectedQuestionType: string | null = null;
  selectedDifficulty: string | null = null;

  constructor(
    private questionService: QuestionService,
    private categoryService: CategoryService,
    private examService: ExamService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
    this.loadCategories();
    this.loadExams();
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.questionService.getAllQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.errorMessage = error.error?.message || 'Failed to load questions';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategoriesForCurrentUser().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadExams(): void {
    this.examService.getAllExams().subscribe({
      next: (exams) => {
        this.exams = exams;
      },
      error: (error) => {
        console.error('Error loading exams:', error);
      }
    });
  }

  get filteredQuestions(): Question[] {
    let filtered = [...this.questions];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.questionText?.toLowerCase().includes(term) ||
        q.correctAnswer?.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (this.selectedCategoryId) {
      filtered = filtered.filter(q => q.category?.id === this.selectedCategoryId);
    }

    // Filter by exam
    if (this.selectedExamId) {
      filtered = filtered.filter(q => q.examId === this.selectedExamId);
    } else if (this.selectedExamId === 0) {
      // Filter for question bank (examId is null/undefined)
      filtered = filtered.filter(q => !q.examId);
    }

    // Filter by question type
    if (this.selectedQuestionType) {
      filtered = filtered.filter(q => q.questionType === this.selectedQuestionType);
    }

    // Filter by difficulty
    if (this.selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === this.selectedDifficulty);
    }

    return filtered;
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

  getDifficultyLabel(difficulty: string | undefined): string {
    if (!difficulty) return 'N/A';
    return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedExamId = null;
    this.selectedQuestionType = null;
    this.selectedDifficulty = null;
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

    this.isLoading = true;
    this.errorMessage = '';

    this.questionService.deleteQuestion(id).subscribe({
      next: () => {
        this.isLoading = false;
        this.loadQuestions();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to delete question';
      }
    });
  }

  createQuestion(): void {
    this.router.navigate(['/questions/new']);
  }

  isCommonCategory(category: { id: number; name: string; isCommon?: boolean } | undefined): boolean {
    return category?.isCommon === true;
  }
}
