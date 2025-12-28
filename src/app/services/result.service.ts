import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ResultWithExam {
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
  createdAt?: string;
  examTitle?: string;
  examDescription?: string;
  passingMarks?: number;
  examDate?: string; // Exam taken date (from session startTime)
  submittedAt?: string;
  status?: string;
  exceptionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private apiUrl = `${environment.apiUrl}/results`;

  constructor(private http: HttpClient) { }

  getResults(): Observable<ResultWithExam[]> {
    return this.http.get<ResultWithExam[]>(this.apiUrl);
  }

  getResultById(id: number): Observable<ResultWithExam> {
    return this.http.get<ResultWithExam>(`${this.apiUrl}/${id}`);
  }
}
