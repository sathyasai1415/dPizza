import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextCursorComponent } from './shared/text-cursor/text-cursor.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TextCursorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  protected readonly themeService = inject(ThemeService);
}
