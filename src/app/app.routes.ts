import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { candidateGuard } from './guards/candidate.guard';
import { organizerAdminGuard } from './guards/organizer-admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { 
    path: 'exam-access/:code', 
    loadComponent: () => import('./components/exam-access/exam-access.component').then(m => m.ExamAccessComponent),
    canActivate: [candidateGuard]
  },
  { 
    path: 'exam-instructions/:examId', 
    loadComponent: () => import('./components/exam-instructions/exam-instructions.component').then(m => m.ExamInstructionsComponent),
    canActivate: [candidateGuard]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'exams', 
    loadComponent: () => import('./components/exam-list/exam-list.component').then(m => m.ExamListComponent),
    canActivate: [organizerAdminGuard]
  },
  { 
    path: 'exams/new', 
    loadComponent: () => import('./components/exam-form/exam-form.component').then(m => m.ExamFormComponent),
    canActivate: [organizerAdminGuard]
  },
  { 
    path: 'exams/:id', 
    loadComponent: () => import('./components/exam-detail/exam-detail.component').then(m => m.ExamDetailComponent),
    canActivate: [organizerAdminGuard]
  },
  { 
    path: 'exams/:id/edit', 
    loadComponent: () => import('./components/exam-form/exam-form.component').then(m => m.ExamFormComponent),
    canActivate: [organizerAdminGuard]
  },
  { 
    path: 'exams/:id/map-questions', 
    loadComponent: () => import('./components/exam-map-questions/exam-map-questions.component').then(m => m.ExamMapQuestionsComponent),
    canActivate: [organizerAdminGuard]
  },
  { 
    path: 'questions', 
    loadComponent: () => import('./components/question-list/question-list.component').then(m => m.QuestionListComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'questions/new', 
    loadComponent: () => import('./components/question-form/question-form.component').then(m => m.QuestionFormComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'questions/:id/edit', 
    loadComponent: () => import('./components/question-form/question-form.component').then(m => m.QuestionFormComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'questions/bulk-upload', 
    loadComponent: () => import('./components/question-bulk-upload/question-bulk-upload.component').then(m => m.QuestionBulkUploadComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'exam-taking/:examId', 
    loadComponent: () => import('./components/exam-taking/exam-taking.component').then(m => m.ExamTakingComponent),
    canActivate: [candidateGuard]
  },
  {
    path: 'exam-acknowledgment',
    loadComponent: () => import('./components/exam-acknowledgment/exam-acknowledgment.component').then(m => m.ExamAcknowledgmentComponent)
  },
  { 
    path: 'results', 
    loadComponent: () => import('./components/result-list/result-list.component').then(m => m.ResultListComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'results/:id', 
    loadComponent: () => import('./components/result-detail/result-detail.component').then(m => m.ResultDetailComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'results/:id/answers', 
    loadComponent: () => import('./components/result-answers/result-answers.component').then(m => m.ResultAnswersComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'change-password', 
    loadComponent: () => import('./components/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'organizers', 
    loadComponent: () => import('./components/organizers/organizers.component').then(m => m.OrganizersComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'categories', 
    loadComponent: () => import('./components/categories/categories.component').then(m => m.CategoriesComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' }
];
