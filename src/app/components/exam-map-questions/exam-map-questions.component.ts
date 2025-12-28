import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService, Exam } from '../../services/exam.service';
import { QuestionService, Question } from '../../services/question.service';
import { CategoryService, Category } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-map-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './exam-map-questions.component.html',
  styleUrl: './exam-map-questions.component.css'
})
export class ExamMapQuestionsComponent implements OnInit {
  exam: Exam | null = null;
  examId: number | null = null;
  availableQuestions: Question[] = [];
  selectedQuestionIds: number[] = [];
  isLoading: boolean = false;
  isLoadingQuestions: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  selectedCategoryId: number | null = null;
  selectedQuestionType: string | null = null;
  selectedDifficulty: string | null = null;

  categories: Category[] = [];

  constructor(
    private examService: ExamService,
    private questionService: QuestionService,
    private categoryService: CategoryService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.examId = +params['id'];
      if (this.examId) {
        this.loadExam(this.examId);
        this.loadAvailableQuestions();
        this.loadCategories();
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

  loadExam(id: number): void {
    this.isLoading = true;
    this.examService.getExamById(id).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.isLoading = false;
        
        // Validate exam status
        if (exam.status !== 'DRAFT') {
          this.errorMessage = 'Only DRAFT exams can be modified';
        }
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.errorMessage = 'Failed to load exam';
        this.isLoading = false;
      }
    });
  }

  loadAvailableQuestions(): void {
    this.isLoadingQuestions = true;
    this.questionService.getAllMappableQuestions().subscribe({
      next: (questions) => {
        // Filter out questions already mapped to this exam
        if (this.examId) {
          this.questionService.getQuestionsByExamId(this.examId).subscribe({
            next: (mappedQuestions) => {
              const mappedQuestionIds = mappedQuestions.map(q => q.id).filter(id => id !== undefined) as number[];
              this.availableQuestions = questions.filter(q => 
                q.id && !mappedQuestionIds.includes(q.id)
              );
              this.isLoadingQuestions = false;
            },
            error: (error) => {
              console.error('Error loading mapped questions:', error);
              this.availableQuestions = questions;
              this.isLoadingQuestions = false;
            }
          });
        } else {
          this.availableQuestions = questions;
          this.isLoadingQuestions = false;
        }
      },
      error: (error) => {
        console.error('Error loading available questions:', error);
        this.errorMessage = 'Failed to load available questions';
        this.isLoadingQuestions = false;
      }
    });
  }

  get filteredQuestions(): Question[] {
    let filtered = [...this.availableQuestions];

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

  toggleQuestionSelection(questionId: number | undefined): void {
    if (!questionId) return;
    const index = this.selectedQuestionIds.indexOf(questionId);
    if (index > -1) {
      this.selectedQuestionIds.splice(index, 1);
    } else {
      this.selectedQuestionIds.push(questionId);
    }
  }

  isQuestionSelected(questionId: number | undefined): boolean {
    if (!questionId) return false;
    return this.selectedQuestionIds.includes(questionId);
  }

  selectAll(): void {
    this.selectedQuestionIds = this.filteredQuestions
      .map(q => q.id)
      .filter(id => id !== undefined) as number[];
  }

  deselectAll(): void {
    this.selectedQuestionIds = [];
  }

  addSelectedQuestions(): void {
    if (!this.examId || this.selectedQuestionIds.length === 0) return;

    if (!this.exam || this.exam.status !== 'DRAFT') {
      this.errorMessage = 'Only DRAFT exams can be modified';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.examService.addQuestionsToExam(this.examId, this.selectedQuestionIds).subscribe({
      next: (exam) => {
        this.isLoading = false;
        // Navigate back to exam detail
        this.router.navigate(['/exams', this.examId]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to add questions';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/exams', this.examId]);
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
    this.selectedQuestionType = null;
    this.selectedDifficulty = null;
  }

}

