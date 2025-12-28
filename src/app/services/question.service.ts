import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Question {
  id?: number;
  examId?: number | null; // Optional now for question bank
  questionText: string;
  questionType: string;
  options?: string;
  correctAnswer?: string;
  marks: number;
  difficulty?: string;
  category?: {
    id: number;
    name: string;
    isCommon?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionRequest {
  questionText: string;
  questionType: string;
  options?: string;
  correctAnswer: string;
  marks: number;
  difficulty?: string;
  categoryId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private apiUrl = `${environment.apiUrl}/questions`;

  constructor(private http: HttpClient) { }

  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  getQuestionById(id: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${id}`);
  }

  getQuestionsByExamId(examId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/exam/${examId}`);
  }

  createQuestion(question: QuestionRequest): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  updateQuestion(id: number, question: QuestionRequest): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, question);
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getRandomQuestionsForExam(examId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/public/exam/${examId}/questions`);
  }

  getQuestionBankQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/bank`);
  }

  getAllMappableQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/mappable`);
  }

  downloadQuestionTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template/download`, {
      responseType: 'blob'
    });
  }

  bulkUploadQuestions(file: File): Observable<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload`, formData);
  }
}

export interface BulkUploadResponse {
  totalRows: number;
  successCount: number;
  failureCount: number;
  createdQuestions: Question[];
  errors: ErrorDetail[];
}

export interface ErrorDetail {
  rowNumber: number;
  questionText: string;
  errorMessage: string;
}
