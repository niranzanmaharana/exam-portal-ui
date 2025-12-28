import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QuestionService, BulkUploadResponse } from '../../services/question.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-question-bulk-upload',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './question-bulk-upload.component.html',
  styleUrl: './question-bulk-upload.component.css'
})
export class QuestionBulkUploadComponent {
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isDownloading: boolean = false;
  uploadResponse: BulkUploadResponse | null = null;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private questionService: QuestionService,
    public authService: AuthService,
    private router: Router
  ) { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        this.errorMessage = 'Please select an Excel file (.xlsx or .xls)';
        this.selectedFile = null;
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 10MB';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
      this.successMessage = '';
      this.uploadResponse = null;
    }
  }

  downloadTemplate(): void {
    this.isDownloading = true;
    this.errorMessage = '';
    
    this.questionService.downloadQuestionTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'question_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
        this.successMessage = 'Template downloaded successfully!';
      },
      error: (error) => {
        console.error('Error downloading template:', error);
        this.errorMessage = 'Failed to download template. Please try again.';
        this.isDownloading = false;
      }
    });
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file to upload';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadResponse = null;

    this.questionService.bulkUploadQuestions(this.selectedFile).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.uploadResponse = response;
        
        if (response.successCount > 0) {
          this.successMessage = `Successfully uploaded ${response.successCount} question(s)!`;
        }
        
        if (response.failureCount > 0) {
          this.errorMessage = `${response.failureCount} question(s) failed to upload. See details below.`;
        }
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Error uploading file:', error);
        
        if (error.error && error.error.errors && error.error.errors.length > 0) {
          this.uploadResponse = error.error;
          this.errorMessage = 'Some questions failed to upload. See details below.';
        } else {
          this.errorMessage = error.error?.message || error.error?.error || 'Failed to upload file. Please try again.';
        }
      }
    });
  }

  clearFile(): void {
    this.selectedFile = null;
    this.uploadResponse = null;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  goToQuestionList(): void {
    this.router.navigate(['/questions']);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
}

