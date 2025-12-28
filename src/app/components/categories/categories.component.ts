import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category, CategoryRequest } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isCreating: boolean = false;
  isEditing: boolean = false;
  editingCategoryId: number | null = null;
  searchTerm: string = '';

  categoryForm: CategoryRequest = {
    name: '',
    description: ''
  };

  constructor(
    private categoryService: CategoryService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Both admin and organizer use getCategoriesForCurrentUser to ensure proper data loading
    this.categoryService.getCategoriesForCurrentUser().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = error.error?.message || 'Failed to load categories';
        this.isLoading = false;
      }
    });
  }

  get filteredCategories(): Category[] {
    let filtered: Category[] = [];
    
    if (!this.searchTerm.trim()) {
      filtered = [...this.categories];
    } else {
      const term = this.searchTerm.toLowerCase();
      filtered = this.categories.filter(category => 
        category.name?.toLowerCase().includes(term) ||
        category.description?.toLowerCase().includes(term)
      );
    }
    
    // Sort: Common categories first, then self-created, then by ID
    const currentUser = this.authService.getCurrentUser();
    return filtered.sort((a, b) => {
      // First priority: Common categories come first
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      
      // Second priority: If both are common, sort by ID
      if (a.isCommon && b.isCommon) {
        return (a.id || 0) - (b.id || 0);
      }
      
      // Third priority: For non-common categories, self-created come first
      if (currentUser) {
        const aIsSelfCreated = a.createdBy?.id === currentUser.id;
        const bIsSelfCreated = b.createdBy?.id === currentUser.id;
        
        if (aIsSelfCreated && !bIsSelfCreated) return -1;
        if (!aIsSelfCreated && bIsSelfCreated) return 1;
      }
      
      // Finally, sort by ID
      return (a.id || 0) - (b.id || 0);
    });
  }

  get commonCategories(): Category[] {
    return this.categories.filter(c => c.isCommon);
  }

  get myCategories(): Category[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    return this.categories.filter(c => 
      !c.isCommon && c.createdBy?.id === currentUser.id
    );
  }

  get filteredCommonCategories(): Category[] {
    return this.filteredCategories.filter(c => c.isCommon === true);
  }

  get filteredMyCategories(): Category[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    return this.filteredCategories.filter(c => 
      !c.isCommon && c.createdBy?.id === currentUser.id
    );
  }

  startCreate(): void {
    this.isCreating = true;
    this.isEditing = false;
    this.editingCategoryId = null;
    this.categoryForm = {
      name: '',
      description: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  startEdit(category: Category): void {
    this.isEditing = true;
    this.isCreating = false;
    this.editingCategoryId = category.id || null;
    this.categoryForm = {
      name: category.name || '',
      description: category.description || ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelForm(): void {
    this.isCreating = false;
    this.isEditing = false;
    this.editingCategoryId = null;
    this.categoryForm = {
      name: '',
      description: ''
    };
    this.errorMessage = '';
  }

  saveCategory(): void {
    if (!this.categoryForm.name?.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const observable = this.isEditing && this.editingCategoryId
      ? this.categoryService.updateCategory(this.editingCategoryId, this.categoryForm)
      : this.categoryService.createCategory(this.categoryForm);

    observable.subscribe({
      next: (category) => {
        this.isLoading = false;
        this.successMessage = this.isEditing ? 'Category updated successfully!' : 'Category created successfully!';
        this.cancelForm();
        this.loadCategories();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to save category';
      }
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Category deleted successfully!';
        this.loadCategories();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error?.error || 'Failed to delete category';
      }
    });
  }

  canEdit(category: Category): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Both admin and organizer can only edit categories they created
    return category.createdBy?.id === currentUser.id;
  }

  canDelete(category: Category): boolean {
    return this.canEdit(category);
  }
}
