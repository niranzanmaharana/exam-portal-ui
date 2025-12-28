import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExamSession {
  id?: number;
  examId: number;
  studentId?: number;
  studentName?: string;
  registrationNumber?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  submittedAt?: string;
  exceptionReason?: string;
}

export interface ExamSessionRequest {
  examId: number;
  studentId?: number;
  studentName?: string;
  registrationNumber?: string;
}

export interface AnswerSubmissionRequest {
  sessionId: number;
  answers: { [questionId: number]: string };
}

export interface ExceptionReportRequest {
  sessionId: number;
  reason: string;
}

export interface ExamResult {
  id?: number;
  sessionId: number;
  examId: number;
  studentId?: number;
  studentName?: string;
  registrationNumber?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamSessionService {
  private apiUrl = `${environment.apiUrl}/exam-sessions`;

  constructor(private http: HttpClient) { }

  createSession(request: ExamSessionRequest): Observable<ExamSession> {
    return this.http.post<ExamSession>(`${this.apiUrl}/create`, request);
  }

  submitExam(request: AnswerSubmissionRequest): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.apiUrl}/submit`, request);
  }

  reportException(request: ExceptionReportRequest): Observable<ExamSession> {
    return this.http.post<ExamSession>(`${this.apiUrl}/exception`, request);
  }

  getSession(sessionId: number): Observable<ExamSession> {
    return this.http.get<ExamSession>(`${this.apiUrl}/${sessionId}`);
  }

  getResult(sessionId: number): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${this.apiUrl}/${sessionId}/result`);
  }

  getAnswersWithQuestions(sessionId: number): Observable<AnswerWithQuestion[]> {
    return this.http.get<AnswerWithQuestion[]>(`${this.apiUrl}/${sessionId}/answers`);
  }
}

export interface AnswerWithQuestion {
  answerId?: number;
  questionId: number;
  questionText: string;
  questionType: string;
  options?: string;
  correctAnswer?: string;
  questionMarks: number;
  difficulty?: string;
  categoryName?: string;
  answerText?: string;
  isCorrect?: boolean;
  marksObtained?: number;
  answeredAt?: string;
}
