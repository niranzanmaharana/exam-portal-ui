import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Exam {
  id?: number;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startTime?: string;
  endTime?: string;
  status: string;
  accessCode?: string;
  rulesAndRestrictions?: string;
  maxQuestions?: number;
  requireFullscreen?: boolean;
  disableRightClick?: boolean;
  requireCamera?: boolean;
  disableCopyPaste?: boolean;
  disablePrintScreen?: boolean;
  preventTabSwitch?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamRequest {
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startTime?: string;
  endTime?: string;
  rulesAndRestrictions?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = `${environment.apiUrl}/exams`;

  constructor(private http: HttpClient) { }

  getAllExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(this.apiUrl);
  }

  getExamById(id: number): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/${id}`);
  }

  getAvailableExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${this.apiUrl}/available`);
  }

  createExam(exam: Exam): Observable<Exam> {
    return this.http.post<Exam>(this.apiUrl, exam);
  }

  updateExam(id: number, exam: Exam): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${id}`, exam);
  }

  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publishExam(id: number): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${id}/publish`, {});
  }

  getExamByAccessCode(accessCode: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/access/${accessCode}`);
  }

  regenerateAccessCode(id: number): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${id}/regenerate-access-code`, {});
  }

  startExamWithPublicAccess(request: { studentName: string; registrationNumber: string; accessCode: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public/start`, request);
  }

  startExamWithAccessCode(accessCode: string): Observable<any> {
    // For authenticated users, just verify access code and return exam info
    return this.getExamByAccessCode(accessCode);
  }

  addQuestionsToExam(examId: number, questionIds: number[]): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${examId}/questions`, questionIds);
  }

  removeQuestionsFromExam(examId: number, questionIds: number[]): Observable<Exam> {
    return this.http.delete<Exam>(`${this.apiUrl}/${examId}/questions`, { body: questionIds });
  }

  setQuestionsForExam(examId: number, questionIds: number[]): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${examId}/questions`, questionIds);
  }
}

export interface ExamAccessRequest {
  studentName: string;
  registrationNumber: string;
}
