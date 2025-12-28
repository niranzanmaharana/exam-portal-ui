import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare var Quill: any;

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: RichTextEditorComponent,
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() placeholder: string = 'Enter text...';
  @Input() height: string = '200px';
  @ViewChild('editor', { static: false }) editorElement!: ElementRef;
  
  private quill: any;
  private onChange = (value: string) => {};
  private onTouched = () => {};
  
  value: string = '';
  
  get hasContent(): boolean {
    const content = this.value?.trim() || '';
    return content !== '' && 
           content !== '<p><br></p>' && 
           content !== '<p></p>' &&
           content !== '<br>';
  }

  ngAfterViewInit(): void {
    // Load Quill dynamically
    this.loadQuill();
  }

  private loadQuill(): void {
    // Check if Quill is available
    if (typeof Quill !== 'undefined') {
      this.initQuill();
    } else {
      // Load Quill from CDN if not available
      const script = document.createElement('script');
      script.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
      script.onload = () => this.initQuill();
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
      document.head.appendChild(link);
    }
  }

  private initQuill(): void {
    if (!this.editorElement) {
      setTimeout(() => this.initQuill(), 100);
      return;
    }

    this.quill = new Quill(this.editorElement.nativeElement, {
      theme: 'snow',
      placeholder: this.placeholder,
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'direction': 'rtl' }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          ['clean'],
          ['link']
        ]
      }
    });

    // Set initial value if exists
    if (this.value) {
      this.quill.root.innerHTML = this.value;
    }

    // Listen for text changes
    this.quill.on('text-change', () => {
      const html = this.quill.root.innerHTML;
      // Clean up unnecessary paragraph tags
      const cleanedHtml = this.cleanHtml(html);
      this.value = cleanedHtml;
      this.onChange(cleanedHtml);
    });

    // Set height
    if (this.height) {
      this.editorElement.nativeElement.style.height = this.height;
    }
  }

  writeValue(value: string): void {
    this.value = value || '';
    if (this.quill && value !== this.quill.root.innerHTML) {
      // If value is plain text without HTML, wrap it for Quill
      let quillValue = this.value;
      if (this.value && !this.value.trim().startsWith('<')) {
        quillValue = `<p>${this.value}</p>`;
      }
      this.quill.root.innerHTML = quillValue;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.quill) {
      this.quill.enable(!isDisabled);
    }
  }

  clearContent(): void {
    if (this.quill) {
      this.quill.setText('');
      this.value = '';
      this.onChange('');
    } else {
      this.value = '';
      this.onChange('');
    }
  }

  private cleanHtml(html: string): string {
    if (!html || html.trim() === '' || html.trim() === '<p><br></p>' || html.trim() === '<p></p>') {
      return '';
    }

    // Remove empty paragraph tags
    html = html.replace(/<p><br><\/p>/g, '');
    html = html.replace(/<p><\/p>/g, '');
    
    // If content is just a single simple paragraph with plain text (no formatting), remove the p tag
    const trimmedHtml = html.trim();
    const pMatch = trimmedHtml.match(/^<p>(.*?)<\/p>$/s);
    if (pMatch) {
      const content = pMatch[1];
      // Check if content has no HTML tags (except possibly <br>)
      const hasOtherTags = /<[^>]+>/.test(content.replace(/<br\s*\/?>/gi, ''));
      
      if (!hasOtherTags) {
        // It's just plain text, remove the paragraph tag
        // Replace <br> with newlines, then trim
        const plainText = content.replace(/<br\s*\/?>/gi, '\n').trim();
        return plainText;
      }
    }
    
    return html;
  }
}

