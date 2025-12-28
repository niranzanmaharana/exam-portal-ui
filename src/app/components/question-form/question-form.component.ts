import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService, Question, QuestionRequest } from '../../services/question.service';
import { CategoryService, Category } from '../../services/category.service';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RichTextEditorComponent],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.css'
})
export class QuestionFormComponent implements OnInit {
  question: Question = {
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    marks: 1,
    difficulty: 'MEDIUM'
  };
  
  categories: Category[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;
  questionId: number | null = null;
  selectedCategoryId: number | null = null;

  constructor(
    private questionService: QuestionService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && this.route.snapshot.url.some(segment => segment.path === 'edit')) {
        this.isEditMode = true;
        this.questionId = +id;
        this.loadQuestion(this.questionId);
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


  loadQuestion(id: number): void {
    this.isLoading = true;
    this.questionService.getQuestionById(id).subscribe({
      next: (question) => {
        this.question = question;
        this.selectedCategoryId = question.category?.id || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading question:', error);
        this.errorMessage = 'Failed to load question';
        this.isLoading = false;
      }
    });
  }

  saveQuestion(): void {
    if (!this.question.questionText?.trim()) {
      this.errorMessage = 'Question text is required';
      return;
    }

    const questionRequest: QuestionRequest = {
      questionText: this.question.questionText,
      questionType: this.question.questionType,
      options: this.question.options,
      correctAnswer: this.question.correctAnswer || '',
      marks: this.question.marks,
      difficulty: this.question.difficulty,
      categoryId: this.selectedCategoryId
    };

    this.isLoading = true;
    this.errorMessage = '';

    const observable = this.isEditMode && this.questionId
      ? this.questionService.updateQuestion(this.questionId, questionRequest)
      : this.questionService.createQuestion(questionRequest);

    observable.subscribe({
      next: (question) => {
        this.isLoading = false;
        this.router.navigate(['/questions']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to save question';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/questions']);
  }

  stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
