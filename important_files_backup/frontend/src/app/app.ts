import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextCursorComponent } from './shared/text-cursor/text-cursor.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TextCursorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
