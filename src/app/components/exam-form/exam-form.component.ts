import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, Exam } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RichTextEditorComponent],
  templateUrl: './exam-form.component.html',
  styleUrl: './exam-form.component.css'
})
export class ExamFormComponent implements OnInit {
  exam: Exam = {
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    status: 'DRAFT'
  };
  
  // Separate date and time properties
  examDate: string = '';
  startTime: string = '';
  endTime: string = '';
  isDurationAutoCalculated: boolean = false;
  
  isLoading: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;
  examId: number | null = null;

  constructor(
    private examService: ExamService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Prevent ADMIN from creating or editing exams
    if (this.authService.isAdmin()) {
      this.errorMessage = 'Administrators cannot create or edit exams. Only viewing and reports are allowed.';
      setTimeout(() => {
        this.router.navigate(['/exams']);
      }, 2000);
      return;
    }
    
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && this.route.snapshot.url.some(segment => segment.path === 'edit')) {
        this.isEditMode = true;
        this.examId = +id;
        this.loadExam(this.examId);
      }
    });
  }

  loadExam(id: number): void {
    this.isLoading = true;
    this.examService.getExamById(id).subscribe({
      next: (exam) => {
        this.exam = exam;
        // Parse datetime strings and split into date and time
        if (exam.startTime) {
          const parsed = this.parseDateTime(exam.startTime);
          this.examDate = parsed.date;
          this.startTime = parsed.time;
        }
        if (exam.endTime) {
          const parsed = this.parseDateTime(exam.endTime);
          // Use the same date for end time (or use the parsed date if different)
          if (!this.examDate) {
            this.examDate = parsed.date;
          }
          this.endTime = parsed.time;
        }
        // Calculate duration if date and times are available
        this.calculateDuration();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.errorMessage = 'Failed to load exam';
        this.isLoading = false;
      }
    });
  }

  parseDateTime(dateTimeString: string | undefined): { date: string, time: string } {
    if (!dateTimeString) return { date: '', time: '' };
    
    // Backend sends LocalDateTime as: "YYYY-MM-DDTHH:mm:ss" (no timezone)
    if (dateTimeString.includes('T')) {
      const [datePart, timePart] = dateTimeString.split('T');
      
      if (datePart && timePart) {
        // Remove seconds and timezone info
        const timeOnly = timePart.split(/[.Z+-]/)[0]; // Get HH:mm:ss or HH:mm
        const [hours, minutes] = timeOnly.split(':');
        
        // Validate format
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/) && hours && minutes) {
          return {
            date: datePart,
            time: `${hours}:${minutes}`
          };
        }
      }
    }
    
    // Fallback: try parsing as Date
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
      };
    }
    
    return { date: '', time: '' };
  }

  combineDateAndTime(date: string, time: string): string | undefined {
    if (!date || !time) return undefined;
    
    // Validate the format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    
    if (!dateRegex.test(date) || !timeRegex.test(time)) {
      return undefined;
    }
    
    // Return in format: YYYY-MM-DDTHH:mm:ss (backend LocalDateTime format)
    // Add seconds as 00 since time input doesn't provide seconds
    return `${date}T${time}:00`;
  }

  calculateDuration(): void {
    // Check if all date and time fields are provided
    if (this.examDate && this.startTime && this.endTime) {
      const startDateTime = this.combineDateAndTime(this.examDate, this.startTime);
      const endDateTime = this.combineDateAndTime(this.examDate, this.endTime);
      
      if (startDateTime && endDateTime) {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        
        // Check if end time is after start time
        if (end > start) {
          // Calculate difference in milliseconds
          const diffMs = end.getTime() - start.getTime();
          // Convert to minutes
          const diffMinutes = Math.round(diffMs / (1000 * 60));
          
          if (diffMinutes > 0) {
            this.exam.duration = diffMinutes;
            this.isDurationAutoCalculated = true;
            return;
          }
        }
      }
    }
    
    // If calculation not possible, allow manual entry
    this.isDurationAutoCalculated = false;
  }

  saveExam(): void {
    if (!this.exam.title?.trim()) {
      this.errorMessage = 'Exam title is required';
      return;
    }

    if (this.exam.passingMarks > this.exam.totalMarks) {
      this.errorMessage = 'Passing marks cannot be greater than total marks';
      return;
    }

    // Validate date and time fields (all must be provided together if any is provided)
    const hasDate = !!this.examDate;
    const hasStartTime = !!this.startTime;
    const hasEndTime = !!this.endTime;

    if (hasDate || hasStartTime || hasEndTime) {
      // If any field is provided, all must be provided
      if (!hasDate) {
        this.errorMessage = 'Exam date is required when start/end time is provided';
        return;
      }
      if (!hasStartTime) {
        this.errorMessage = 'Start time is required when exam date is provided';
        return;
      }
      if (!hasEndTime) {
        this.errorMessage = 'End time is required when exam date is provided';
        return;
      }

      // Combine date and time for validation
      const startDateTime = this.combineDateAndTime(this.examDate, this.startTime);
      const endDateTime = this.combineDateAndTime(this.examDate, this.endTime);

      if (startDateTime && endDateTime) {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (end <= start) {
          this.errorMessage = 'End time must be after start time';
          return;
        }
      }
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Combine date and time into datetime format for API
    const examToSave: Exam = {
      ...this.exam,
      startTime: this.combineDateAndTime(this.examDate, this.startTime),
      endTime: this.combineDateAndTime(this.examDate, this.endTime)
    };

    const observable = this.isEditMode && this.examId
      ? this.examService.updateExam(this.examId, examToSave)
      : this.examService.createExam(examToSave);

    observable.subscribe({
      next: (exam) => {
        this.isLoading = false;
        this.router.navigate(['/exams']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to save exam';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/exams']);
  }
}
