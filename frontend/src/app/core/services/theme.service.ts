import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('dark');

  constructor() {
    document.documentElement.classList.add('dark');
  }

  toggleTheme(): void {
    // Lock to dark theme only
  }

  setTheme(theme: Theme): void {
    // Lock to dark theme only
  }
}
